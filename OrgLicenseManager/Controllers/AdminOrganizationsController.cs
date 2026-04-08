using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Contracts.Organizations.Responses;
using OrgLicenseManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OrgLicenseManager.Controllers;

[ApiController]
[Route("api/admin/organizations")]
[Authorize(Roles = "Admin")]
public class AdminOrganizationsController(IOrganizationService organizationService) : ControllerBase
{
    private readonly IOrganizationService _organizationService = organizationService;

    [HttpGet]
    public async Task<IResult> GetOrganizations([FromQuery] PaginationRequest pagination)
    {
        var pagedOrganizations = await _organizationService.GetAllOrganizationsPagedAsync(pagination);

        var response = new PagedResult<OrganizationResponse>(
            Items: pagedOrganizations.Items.Select(o => new OrganizationResponse(
                Id: o.Id,
                Name: o.Name,
                Description: o.Description,
                CreatedAt: o.CreatedAt,
                UpdatedAt: o.UpdatedAt,
                MemberCount: o.Memberships.Count)).ToList(),
            Page: pagedOrganizations.Page,
            PageSize: pagedOrganizations.PageSize,
            TotalCount: pagedOrganizations.TotalCount,
            TotalPages: pagedOrganizations.TotalPages,
            HasPreviousPage: pagedOrganizations.HasPreviousPage,
            HasNextPage: pagedOrganizations.HasNextPage);

        return Results.Ok(response);
    }
}
