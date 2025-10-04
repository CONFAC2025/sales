export type PotentialLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type CustomerStatus = 'REGISTERED' | 'VISITED' | 'CONSULTED' | 'CONTRACTED' | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  status: CustomerStatus;
  notes: string | null;
  interestedProperty: string | null;
  potential: PotentialLevel | null;
  source: string | null;
  registeredById: string;
  createdAt: string;
  updatedAt: string;
  // This field is included from the backend query
  registeredBy?: {
    name: string;
    department: { name: string } | null;
    team: { name: string } | null;
  };
}
