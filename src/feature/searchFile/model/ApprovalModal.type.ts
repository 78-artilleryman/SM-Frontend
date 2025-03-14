export type ApprovedData = {
  code: number;
  message: string;
  result: {
    issueId: string;
    erDat: string;
    suName: string;
    suId: string;
    ipName: string;
    ipId: string;
    taxTotal: string;
    processStatus: "UNAPPROVED" | "APPROVED" | "REJECTED";
    url: string;
  };
  success: boolean;
};
  