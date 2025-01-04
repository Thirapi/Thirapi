import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { BsSpotify } from "react-icons/bs";
import { SpotifyProvider } from "@/components/SpotifyProvider";
import NowPlaying from "@/components/NowPlaying";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className="bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen flex items-center justify-center"
    >
      <SpotifyProvider>
        <NowPlaying icon={<BsSpotify />} />
      </SpotifyProvider>
    </div>
  );
}
