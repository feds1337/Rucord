cask "rucord" do
  version "1.0.0-nightly.20261014.58"
  sha256 "efbaf7adac3075c639249d387aa419bf44fe39ab84c079e4080cd6b0a228ed65"

  url "https://github.com/feds1337/Rucord/releases/download/v#{version}/rucord-v#{version}-macOS-ARM64.zip"
  name "Rucord"
  desc "Experimental native Discord client"
  homepage "https://github.com/feds1337/Rucord"

  # Packaging template; the version and checksum below come from the upstream archive.
  # Replace both when publishing the first Rucord release.
  disable! because: "Rucord releases have not been published yet"

  depends_on arch: :arm64
  depends_on macos: :sonoma

  app "Rucord.app"
end
