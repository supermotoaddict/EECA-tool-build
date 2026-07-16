export type Occupancy = "owner" | "rental";

export interface AddressSuggestion {
  id: string;
  label: string;
}

export interface AddressDetails {
  id: string;
  label: string;
  lat: number;
  lon: number;
  suburb?: string;
  town?: string;
  postcode?: string;
}

export interface FormAnswers {
  address: AddressSuggestion;
  occupancy: Occupancy;
  builtBefore2008: boolean;
  hasCommunityServicesCard: boolean;
  contactMessage?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  consent: boolean;
}

export interface NzDepResult {
  sa1Code: string;
  sa2Name: string | null;
  decile: number | null;
  source: "arcgis";
}

export interface EecaResult {
  checked: boolean;
  hasExistingClaim: boolean;
  hasInsulationRequest: boolean;
  hasHeatingRequest: boolean;
  hasInsulation: boolean;
  hasHeating: boolean;
  addressInsulationValid: boolean | null;
  addressHeatingValid: boolean | null;
  error?: string;
  raw?: Record<string, unknown>;
}

export interface EligibilityResult {
  eligible: boolean;
  fundingPercent: number | null;
  fundingReason: string;
  ineligibleReason?: string;
  nzDep: NzDepResult | null;
  eeca: EecaResult;
  answers: {
    addressLabel: string;
    addressId: string;
    occupancy: Occupancy;
    builtBefore2008: boolean;
    hasCommunityServicesCard: boolean;
  };
  checkedAt: string;
}

export interface SubmissionPayload {
  result: EligibilityResult;
  contactMessage?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
