namespace OrgLicenseManager.Contracts.Licenses.Requests;

public record UpdateLicenseRequest(DateTime? ExpiresAt, bool? AutoRenewal);
