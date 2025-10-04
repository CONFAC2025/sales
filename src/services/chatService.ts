import { prisma } from '../utils/prisma';
import { User, ChatRoom, Prisma, UserType, ChatMessage } from '@prisma/client';
import { sendToUser } from '../websocket';
import { NotificationService } from './notificationService';

export class ChatService {

  /**
   * Get all users who are subordinates of a given user.
   */
  public static async getSubordinates(user: User): Promise<User[]> {
    if (user.userType === 'TEAM_LEADER' && user.teamId) {
      return prisma.user.findMany({
        where: { teamId: user.teamId, id: { not: user.id } }
      });
    }
    if (user.userType === 'DEPARTMENT_MANAGER' && user.departmentId) {
      return prisma.user.findMany({
        where: { departmentId: user.departmentId, id: { not: user.id } }
      });
    }
    // Admin can select anyone
    if (user.userType === 'ADMIN_STAFF') {
      return prisma.user.findMany({ where: { id: { not: user.id } } });
    }
    return [];
  }

  /**
   * Get all users a given user can start a chat with, based on hierarchy.
   */
  public static async getChatTargets(user: User): Promise<User[]> {
    const { userType, teamId, departmentId, organizationLevel } = user;

    switch (userType) {
      case UserType.SALES_STAFF:
      case UserType.REAL_ESTATE:
      case UserType.PARTNER_STAFF:
        if (!teamId) return [];
        // Team members can chat with their own team (leader and other members)
        return prisma.user.findMany({
          where: { teamId: teamId, id: { not: user.id } },
          orderBy: { organizationLevel: 'asc' },
        });

      case UserType.TEAM_LEADER:
        if (!departmentId) return [];
        // Team leaders can chat with their department manager and other team leaders in the same department
        return prisma.user.findMany({
          where: {
            departmentId: departmentId,
            id: { not: user.id },
            OR: [
              { userType: UserType.DEPARTMENT_MANAGER },
              { userType: UserType.TEAM_LEADER },
            ],
          },
          orderBy: { organizationLevel: 'asc' },
        });

      case UserType.DEPARTMENT_MANAGER:
        // Department managers can chat with upper management
        return prisma.user.findMany({
          where: {
            organizationLevel: { lt: organizationLevel }, // Lower number means higher rank
            id: { not: user.id },
          },
          orderBy: { organizationLevel: 'asc' },
        });

      case UserType.GENERAL_HQ_MANAGER:
      case UserType.MIDDLE_MANAGER:
      case UserType.ADMIN_STAFF:
        // Top-level managers can chat with anyone
        return prisma.user.findMany({ 
          where: { id: { not: user.id } },
          orderBy: { name: 'asc' },
        });

      default:
        return [];
    }
  }

  /**
   * Create a new chat room.
   */
  public static async createChatRoom(creatorId: string, memberIds: string[], name: string): Promise<ChatRoom> {
    const allMemberIds = [...new Set([creatorId, ...memberIds])]; // Ensure creator is included

    const newRoom = await prisma.chatRoom.create({
      data: {
        name,
        isGroup: true,
        members: {
          create: allMemberIds.map(id => ({
            user: { connect: { id } }
          }))
        }
      },
      include: {
        members: { include: { user: true } }
      }
    });

    // Notify members about the new room
    for (const memberId of allMemberIds) {
      if (memberId !== creatorId) {
        sendToUser(memberId, { type: 'NEW_CHAT_ROOM', payload: newRoom });
      }
    }

    return newRoom;
  }
  
  /**
   * Get all chat rooms a user is a member of.
   */
  public static async getChatRoomsForUser(userId: string): Promise<ChatRoom[]> {
    return prisma.chatRoom.findMany({
      where: {
        members: {
          some: { userId: userId }
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Get messages for a specific room.
   */
  public static async getMessagesForRoom(roomId: string): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        sender: { select: { id: true, name: true } }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100 // Get latest 100 messages
    });
  }

  /**
   * Save a new chat message and send it to room members.
   */
  public static async saveMessage(roomId: string, senderId: string, content: string, fileUrl?: string, fileType?: string, fileName?: string): Promise<ChatMessage> {
    const [newMessage, room] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          content,
          fileUrl,
          fileType,
          fileName,
          room: { connect: { id: roomId } },
          sender: { connect: { id: senderId } },
        },
        include: {
          sender: { select: { id: true, name: true } }
        }
      }),
      prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
        include: { members: true },
      })
    ]);

    // Send real-time message and create notification for all room members
    if (room) {
      for (const member of room.members) {
        // Send real-time message
        sendToUser(member.userId, { type: 'NEW_MESSAGE', payload: newMessage });

        // Create a persistent notification for the recipient, but not for the sender
        if (member.userId !== senderId) {
          NotificationService.createNotification({
            recipientId: member.userId,
            type: 'NEW_CHAT_MESSAGE',
            message: `[${room.name || '대화'}] ${newMessage.sender.name}님으로부터 새 메시지`,
            link: `/chat?roomId=${roomId}`,
          }).then(notification => {
            // Also send the notification via websocket for immediate UI update
            sendToUser(member.userId, { type: 'NEW_NOTIFICATION', payload: notification });
          });
        }
      }
    }

    return newMessage;
  }

  /**
   * Finds or creates a one-on-one chat room between two users.
   */
  public static async findOrCreateOneOnOneChat(userId1: string, userId2: string): Promise<ChatRoom> {
    // Find a non-group chat room with exactly these two members
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userId1 } } },
          { members: { some: { userId: userId2 } } },
        ],
        members: {
          every: {
            userId: { in: [userId1, userId2] }
          }
        }
      },
      include: {
        members: { include: { user: true } }
      }
    });

    if (existingRoom) {
      return existingRoom;
    }

    // If not found, create a new one-on-one chat room
    const newRoom = await prisma.chatRoom.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { user: { connect: { id: userId1 } } },
            { user: { connect: { id: userId2 } } },
          ],
        },
      },
      include: {
        members: { include: { user: true } }
      }
    });

    // Notify the other user that a new room was created
    sendToUser(userId2, { type: 'NEW_CHAT_ROOM', payload: newRoom });

    return newRoom;
  }

  /**
   * Deletes a chat room if the user is a member.
   */
  public static async deleteChatRoom(roomId: string, userId: string): Promise<void> {
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        members: { some: { userId } },
      },
      include: {
        members: true, // Include members to notify them
      },
    });

    if (!room) {
      throw new Error('Room not found or user is not a member.');
    }

    const membersToNotify = room.members.filter(m => m.userId !== userId);

    // Use a transaction to ensure all related data is deleted together
    try {
      await prisma.$transaction([
        prisma.chatInvitation.deleteMany({ where: { roomId } }),
        prisma.chatMessage.deleteMany({ where: { roomId } }),
        prisma.chatRoomMember.deleteMany({ where: { roomId } }),
        prisma.chatRoom.delete({ where: { id: roomId } }),
      ]);
    } catch (error) {
      console.error('Error during chat room deletion transaction:', error);
      throw error; // Re-throw the error to be caught by the route handler
    }

    // Notify other members
    for (const member of membersToNotify) {
      sendToUser(member.userId, { type: 'CHAT_ROOM_DELETED', payload: { roomId } });
    }
  }

  /**
   * Deletes a message if the user is the sender.
   */
  public static async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found.');
    }

    if (message.senderId !== userId) {
      throw new Error('You can only delete your own messages.');
    }

    await prisma.chatMessage.delete({ where: { id: messageId } });
  }
}
