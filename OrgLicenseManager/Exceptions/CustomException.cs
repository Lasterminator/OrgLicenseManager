namespace OrgLicenseManager.Exceptions;

public abstract class CustomException : Exception
{
    public int StatusCode { get; }
    public string? Detail { get; }

    protected CustomException(string message, int statusCode, string? detail = null)
        : base(message)
    {
        StatusCode = statusCode;
        Detail = detail;
    }
}
