using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Contracts.Licenses.Requests;
using OrgLicenseManager.Contracts.Licenses.Responses;
using OrgLicenseManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OrgLicenseManager.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class LicensesController : ControllerBase
{
    private readonly ILicenseService _licenseService;
    private readonly ILicenseSettingsService _licenseSettings;

    public LicensesController(ILicenseService licenseService, ILicenseSettingsService licenseSettings)
    {
        _licenseService = licenseService;
        _licenseSettings = licenseSettings;
    }

    [HttpPost("organizations/{organizationId}")]
    public async Task<IResult> CreateLicenseForOrganization(Guid organizationId, [FromBody] CreateLicenseRequest request)
    {
        var license = await _licenseService.CreateAsync(organizationId, request.AutoRenewal);

        var response = new LicenseResponse(
            Id: license.Id,
            OrganizationId: license.OrganizationId,
            AssignedToUserId: license.AssignedToUserId,
            AssignedToEmail: license.AssignedToUser?.Email,
            ExpiresAt: license.ExpiresAt,
            AutoRenewal: license.AutoRenewal,
            IsActive: license.IsActive,
            IsExpired: license.ExpiresAt <= DateTime.UtcNow,
            CreatedAt: license.CreatedAt,
            UpdatedAt: license.UpdatedAt);

        return Results.Created($"/api/admin/licenses/{license.Id}", response);
    }

    [HttpGet]
    public async Task<IResult> GetAllLicenses([FromQuery] PaginationRequest pagination)
    {
        var pagedLicenses = await _licenseService.GetAllPagedAsync(pagination);

        var response = new PagedResult<LicenseResponse>(
            Items: pagedLicenses.Items.Select(l => new LicenseResponse(
                Id: l.Id,
                OrganizationId: l.OrganizationId,
                AssignedToUserId: l.AssignedToUserId,
                AssignedToEmail: l.AssignedToUser?.Email,
                ExpiresAt: l.ExpiresAt,
                AutoRenewal: l.AutoRenewal,
                IsActive: l.IsActive,
                IsExpired: l.ExpiresAt <= DateTime.UtcNow,
                CreatedAt: l.CreatedAt,
                UpdatedAt: l.UpdatedAt)).ToList(),
            Page: pagedLicenses.Page,
            PageSize: pagedLicenses.PageSize,
            TotalCount: pagedLicenses.TotalCount,
            TotalPages: pagedLicenses.TotalPages,
            HasPreviousPage: pagedLicenses.HasPreviousPage,
            HasNextPage: pagedLicenses.HasNextPage);

        return Results.Ok(response);
    }

    [HttpPut("{identifier}")]
    public async Task<IResult> UpdateLicense(Guid identifier, [FromBody] UpdateLicenseRequest request)
    {
        var license = await _licenseService.UpdateAsync(identifier, request.ExpiresAt, request.AutoRenewal);

        var response = new LicenseResponse(
            Id: license.Id,
            OrganizationId: license.OrganizationId,
            AssignedToUserId: license.AssignedToUserId,
            AssignedToEmail: license.AssignedToUser?.Email,
            ExpiresAt: license.ExpiresAt,
            AutoRenewal: license.AutoRenewal,
            IsActive: license.IsActive,
            IsExpired: license.ExpiresAt <= DateTime.UtcNow,
            CreatedAt: license.CreatedAt,
            UpdatedAt: license.UpdatedAt);

        return Results.Ok(response);
    }

    [HttpDelete("{identifier}")]
    public async Task<IResult> CancelLicense(Guid identifier)
    {
        await _licenseService.CancelAsync(identifier);
        return Results.NoContent();
    }

    [HttpGet("settings")]
    public IResult GetLicenseSettings()
    {
        var response = new LicenseSettingsResponse(_licenseSettings.ExpirationMinutes);
        return Results.Ok(response);
    }

    [HttpPut("settings")]
    public IResult UpdateLicenseSettings([FromBody] UpdateLicenseSettingsRequest request)
    {
        _licenseSettings.SetExpirationMinutes(request.ExpirationMinutes);
        var response = new LicenseSettingsResponse(_licenseSettings.ExpirationMinutes);
        return Results.Ok(response);
    }
}
