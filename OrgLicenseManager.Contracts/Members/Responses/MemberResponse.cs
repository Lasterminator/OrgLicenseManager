namespace OrgLicenseManager.Contracts.Members.Responses;

public record MemberResponse(
    Guid UserId,
    string Email,
    string Role,
    DateTime JoinedAt,
    LicenseInfo? License);

public record LicenseInfo(
    Guid Id,
    DateTime ExpiresAt,
    bool IsExpired,
    bool AutoRenewal);
