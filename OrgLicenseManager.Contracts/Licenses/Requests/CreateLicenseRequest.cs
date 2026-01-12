namespace OrgLicenseManager.Contracts.Licenses.Requests;

public record CreateLicenseRequest(bool AutoRenewal = true);
