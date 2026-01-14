using OrgLicenseManager.Services;

namespace OrgLicenseManager.BackgroundServices;

public class LicenseRenewalService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LicenseRenewalService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public LicenseRenewalService(IServiceProvider serviceProvider, ILogger<LicenseRenewalService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("License renewal background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var licenseService = scope.ServiceProvider.GetRequiredService<ILicenseService>();
                await licenseService.RenewExpiredLicensesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during license renewal check");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("License renewal background service stopped");
    }
}
