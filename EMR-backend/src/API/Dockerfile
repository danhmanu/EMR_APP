# Use the official .NET 8 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["EMR-backend/src/API/EMR.Api.csproj", "EMR.Api/"]
RUN dotnet restore "EMR.Api/EMR.Api.csproj"

# Copy everything else and build
COPY EMR-backend/src/ .
WORKDIR "/src/EMR.Api"
RUN dotnet build "EMR.Api.csproj" -c Release -o /app/build

# Publish the app
RUN dotnet publish "EMR.Api.csproj" -c Release -o /app/publish

# Use the official .NET 8 runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 80
EXPOSE 80

# Run the app
ENTRYPOINT ["dotnet", "EMR.Api.dll"]