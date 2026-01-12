using System.ComponentModel.DataAnnotations;

namespace OrgLicenseManager.Contracts.Licenses.Requests;

public record UpdateLicenseSettingsRequest(
    [Required(ErrorMessage = "Expiration minutes is required")]
    [Range(1, 525600, ErrorMessage = "Expiration minutes must be between 1 and 525600 (1 year)")]
    int ExpirationMinutes);
