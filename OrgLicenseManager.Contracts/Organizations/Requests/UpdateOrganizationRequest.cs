using System.ComponentModel.DataAnnotations;

namespace OrgLicenseManager.Contracts.Organizations.Requests;

public record UpdateOrganizationRequest(
    [Required(ErrorMessage = "Organization name is required")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Organization name must be between 2 and 200 characters")]
    string Name,

    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    string? Description);
