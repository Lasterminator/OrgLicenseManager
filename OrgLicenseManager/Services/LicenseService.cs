using System.Linq.Expressions;
using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Data;
using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;
using OrgLicenseManager.Extensions;
using Microsoft.EntityFrameworkCore;

namespace OrgLicenseManager.Services;

public class LicenseService : ILicenseService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<LicenseService> _logger;
    private readonly ILicenseSettingsService _licenseSettings;

    public LicenseService(ApplicationDbContext context, ILogger<LicenseService> logger, ILicenseSettingsService licenseSettings)
    {
        _context = context;
        _logger = logger;
        _licenseSettings = licenseSettings;
    }

    public async Task<License> CreateAsync(Guid organizationId, bool autoRenewal)
    {
        var organization = await _context.Organizations.FindAsync(organizationId);
        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        var license = new License
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_licenseSettings.ExpirationMinutes),
            AutoRenewal = autoRenewal,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Licenses.Add(license);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created license {LicenseId} for organization {OrganizationId}", license.Id, organizationId);

        return license;
    }

    public async Task<PagedResult<License>> GetAllPagedAsync(PaginationRequest pagination)
    {
        var sortMappings = new Dictionary<string, Expression<Func<License, object>>>
        {
            ["createdat"] = l => l.CreatedAt,
            ["expiresat"] = l => l.ExpiresAt,
            ["isactive"] = l => l.IsActive,
            ["autorenewal"] = l => l.AutoRenewal,
            ["organizationid"] = l => l.OrganizationId
        };

        var query = _context.Licenses
            .Include(l => l.AssignedToUser)
            .Include(l => l.Organization)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(pagination.Search))
        {
            var search = pagination.Search.ToLower();
            query = query.Where(l =>
                (l.AssignedToUser != null && l.AssignedToUser.Email.ToLower().Contains(search)) ||
                l.Organization.Name.ToLower().Contains(search));
        }

        query = query.ApplySort(pagination.SortBy, pagination.SortDescending, sortMappings, l => l.CreatedAt);

        return await query.ToPagedResultAsync(pagination);
    }

    public async Task<License?> GetByIdAsync(Guid licenseId)
    {
        return await _context.Licenses
            .Include(l => l.AssignedToUser)
            .FirstOrDefaultAsync(l => l.Id == licenseId);
    }

    public async Task<License> UpdateAsync(Guid licenseId, DateTime? expiresAt, bool? autoRenewal)
    {
        var license = await _context.Licenses
            .Include(l => l.AssignedToUser)
            .FirstOrDefaultAsync(l => l.Id == licenseId);

        if (license == null)
        {
            throw new NotFoundException("License not found", $"License with ID {licenseId} does not exist");
        }

        if (expiresAt.HasValue)
        {
            if (expiresAt.Value <= DateTime.UtcNow)
            {
                throw new BadRequestException("Invalid expiration date", "Expiration date must be in the future");
            }
            license.ExpiresAt = expiresAt.Value;
        }

        if (autoRenewal.HasValue)
        {
            license.AutoRenewal = autoRenewal.Value;
        }

        license.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated license {LicenseId}", licenseId);

        return license;
    }

    public async Task CancelAsync(Guid licenseId)
    {
        var license = await _context.Licenses.FindAsync(licenseId);

        if (license == null)
        {
            throw new NotFoundException("License not found", $"License with ID {licenseId} does not exist");
        }

        license.IsActive = false;
        license.AutoRenewal = false;
        license.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cancelled license {LicenseId}", licenseId);
    }

    public async Task RenewExpiredLicensesAsync()
    {
        var licensesToRenew = await _context.Licenses
            .Where(l => l.IsActive && l.AutoRenewal && l.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        foreach (var license in licensesToRenew)
        {
            license.ExpiresAt = DateTime.UtcNow.AddMinutes(_licenseSettings.ExpirationMinutes);
            license.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("Renewed license {LicenseId} for organization {OrganizationId}", license.Id, license.OrganizationId);
        }

        if (licensesToRenew.Count > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Renewed {Count} expired licenses", licensesToRenew.Count);
        }
    }
}
