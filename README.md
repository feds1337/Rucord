# Rucord

<p align="center"><img src="assets/brand/rucord-1024.png" width="160" alt="Minimal Rucord logo" /></p>

Rucord is an unofficial native Discord client built with Rust and egui. It brings text channels, voice, and video into a desktop app. This is an independent project and is neither endorsed nor supported by Discord.

> Using a third-party client may violate Discord's rules and could lead to account restrictions. Review the [compatibility limits](docs/discord-compatibility.md) before signing in. Protocol behavior is not guaranteed.

## Features

- Native desktop interface for Windows, macOS, and Linux.
- Text channels, direct messages, voice, video, and screen sharing.
- Local appearance settings, an extension catalog, and an extension SDK.
- Russian interface and additional localizations.
- Offline demo with synthetic data that does not connect to Discord.

Some features rely on an unofficial protocol and may stop working. See the [compatibility documentation](docs/discord-compatibility.md) for known limitations.

## Download and install

Stable builds are published in the [latest release](https://github.com/feds1337/Rucord/releases/latest).

### Windows

Rucord 1.0.0 provides Windows x64 packages: use `rucord-v1.0.0-Windows-X64-Setup.exe` for a per-user installation, or download `rucord-v1.0.0-Windows-X64.zip` for portable use. The installer creates shortcuts and an uninstall entry and does not require administrator privileges. The binaries are not Authenticode-signed, so Windows SmartScreen may show a warning.

### Linux

Rucord 1.0.0 provides a `.deb` package for Ubuntu 24.04 on x86_64. Runtime dependencies are declared in the package metadata. The project also includes packaging definitions for RPM, Arch, AppImage, and Flatpak; check the release page to see which formats are available for a particular version. See the [Linux packaging guide](packaging/linux/README.md) for system dependencies and build instructions. Packages are currently distributed as release downloads; a signed update repository is not configured.

AppImage builds use GTK4 and WebKitGTK from the host system. Flatpak bundles require the Flatpak runtime and are not published to Flathub. macOS can be built from source, but this release does not include a macOS binary.

## Build from source

Install the Rust toolchain specified in `rust-toolchain.toml` and the platform dependencies listed in the [platform guide](docs/platform-support.md).

```sh
cargo run --locked --features demo -- --demo
cargo xtask check
cargo xtask package
```

The demo uses synthetic data and does not test a connection to Discord. When redistributing a build, include the third-party licenses and notices from [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Data and extensions

Rucord stores its settings, cache, and credentials in its own data directories. It does not modify or automatically import data from other applications. Extension ABI names and package formats are retained for compatibility.

Documentation: [storage policy](docs/storage-policy.md), [authentication](docs/authentication.md), [platform support](docs/platform-support.md), and the [extension SDK](docs/extension-sdk-overview.md). The source code is licensed under MIT or Apache-2.0. Third-party components may use other licenses; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
