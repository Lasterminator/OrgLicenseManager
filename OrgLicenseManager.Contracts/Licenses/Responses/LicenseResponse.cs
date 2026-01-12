namespace OrgLicenseManager.Contracts.Licenses.Responses;

public record LicenseResponse(
    Guid Id,
    Guid OrganizationId,
    Guid? AssignedToUserId,
    string? AssignedToEmail,
    DateTime ExpiresAt,
    bool AutoRenewal,
    bool IsActive,
    bool IsExpired,
    DateTime CreatedAt,
    DateTime UpdatedAt);
