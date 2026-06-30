# ---- Build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY TallerApi.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish TallerApi.csproj -c Release -o /app

# ---- Runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app ./

# Render/Railway/Fly inyectan el puerto; por defecto 10000 (Render)
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "TallerApi.dll"]
