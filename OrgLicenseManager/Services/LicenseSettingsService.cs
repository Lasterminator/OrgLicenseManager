using OrgLicenseManager.Data;
using OrgLicenseManager.Entities;
using Microsoft.EntityFrameworkCore;

namespace OrgLicenseManager.Services;

public interface ILicenseSettingsService
{
    int ExpirationMinutes { get; }
    void SetExpirationMinutes(int minutes);
    Task InitializeAsync();
}

public class LicenseSettingsService : ILicenseSettingsService
{
    private const int DefaultExpirationMinutes = 10;
    private const string LicenseExpirationKey = "LicenseExpirationMinutes";

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LicenseSettingsService> _logger;
    private int _expirationMinutes = DefaultExpirationMinutes;
    private readonly object _lock = new();

    public LicenseSettingsService(IServiceScopeFactory scopeFactory, ILogger<LicenseSettingsService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public int ExpirationMinutes
    {
        get
        {
            lock (_lock)
            {
                return _expirationMinutes;
            }
        }
    }

    public async Task InitializeAsync()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var setting = await context.AppSettings.FirstOrDefaultAsync(s => s.Key == LicenseExpirationKey);

            if (setting != null && int.TryParse(setting.Value, out var minutes) && minutes > 0)
            {
                lock (_lock)
                {
                    _expirationMinutes = minutes;
                }
                _logger.LogInformation("Loaded license expiration setting from database: {Minutes} minutes", minutes);
            }
            else
            {
                _logger.LogInformation("Using default license expiration: {Minutes} minutes", DefaultExpirationMinutes);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load license settings from database, using default: {Minutes} minutes", DefaultExpirationMinutes);
        }
    }

    public void SetExpirationMinutes(int minutes)
    {
        if (minutes <= 0)
        {
            throw new ArgumentException("Expiration minutes must be greater than 0", nameof(minutes));
        }

        lock (_lock)
        {
            _expirationMinutes = minutes;
        }

        // Persist to database asynchronously
        _ = PersistSettingAsync(minutes);
    }

    private async Task PersistSettingAsync(int minutes)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var setting = await context.AppSettings.FirstOrDefaultAsync(s => s.Key == LicenseExpirationKey);

            if (setting == null)
            {
                setting = new AppSetting
                {
                    Key = LicenseExpirationKey,
                    Value = minutes.ToString(),
                    UpdatedAt = DateTime.UtcNow
                };
                context.AppSettings.Add(setting);
            }
            else
            {
                setting.Value = minutes.ToString();
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
            _logger.LogInformation("Persisted license expiration setting: {Minutes} minutes", minutes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist license expiration setting");
        }
    }
}
