using System.ComponentModel.DataAnnotations;

namespace OrgLicenseManager.Contracts.Licenses.Requests;

public record AssignLicenseRequest(
    [Required(ErrorMessage = "License ID is required")]
    Guid LicenseId);
