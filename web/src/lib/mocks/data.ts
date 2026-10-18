import type {
  Room,
  Member,
  Video,
  Playlist,
  User,
  History,
} from "@watchsync/shared/types";
export const photos = {
  cinema: "/images/cinema.png",
  anime:
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=960&q=85",
  city: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=960&q=85",
  code: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=960&q=85",
  travel:
    "https://images.unsplash.com/photo-1506918357967-b358ad447c56?auto=format&fit=crop&w=960&q=85",
  music:
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=960&q=85",
};
export const mockUser: User = {
  id: "rizky",
  name: "Rizky Pratama",
  email: "rizky.pratama@example.com",
  image: "https://i.pravatar.cc/100?img=12",
};
export const members: Member[] = [
  {
    id: "rizky",
    displayName: "Rizky Pratama",
    avatarUrl: mockUser.image,
    role: "owner",
    isMuted: false,
    online: true,
  },
  {
    id: "ayu",
    displayName: "Ayu Lestari",
    avatarUrl: "https://i.pravatar.cc/100?img=47",
    role: "moderator",
    isMuted: false,
    online: true,
  },
  {
    id: "budi",
    displayName: "Budi Santoso",
    avatarUrl: "https://i.pravatar.cc/100?img=13",
    role: "member",
    isMuted: true,
    online: true,
  },
  {
    id: "nadia",
    displayName: "Nadia Putri",
    avatarUrl: "https://i.pravatar.cc/100?img=44",
    role: "member",
    isMuted: false,
    online: true,
    speaking: true,
  },
  {
    id: "fajar",
    displayName: "Fajar Hidayat",
    avatarUrl: "https://i.pravatar.cc/100?img=14",
    role: "member",
    isMuted: false,
    online: false,
  },
];
export const videos: Video[] = [
  {
    id: "v1",
    youtubeVideoId: "aqz-KE-bpKQ",
    title: "Trailer Resmi Film Pendek Jakarta Malam",
    channelTitle: "Kanal Film Nusantara",
    thumbnailUrl: photos.city,
    durationSec: 272,
    position: 0,
    addedByMemberId: "rizky",
  },
  {
    id: "v2",
    youtubeVideoId: "Tn6-PIqc4UM",
    title: "Tutorial Membuat Website dengan Next.js untuk Pemula",
    channelTitle: "Kode Bareng",
    thumbnailUrl: photos.code,
    durationSec: 1125,
    position: 1,
    addedByMemberId: "ayu",
  },
  {
    id: "v3",
    youtubeVideoId: "ScMzIvxBSi4",
    title: "Vlog Jalan-Jalan Yogyakarta 3 Hari",
    channelTitle: "Jejak Kaki Vlog",
    thumbnailUrl: photos.travel,
    durationSec: 1570,
    position: 2,
    addedByMemberId: "nadia",
  },
  {
    id: "v4",
    youtubeVideoId: "jNQXAC9IVRw",
    title: "Musik Akustik untuk Menemani Malam",
    channelTitle: "Ruang Nada",
    thumbnailUrl: photos.music,
    durationSec: 1840,
    position: 3,
    addedByMemberId: "ayu",
  },
];
const base = {
  description:
    "Ambil camilan favoritmu, ajak teman, dan nikmati cerita bersama. Semua boleh ikut mengobrol!",
  controlMode: "owner_only" as const,
  hasPassword: false,
  maxMembers: 50,
  members,
  videos: videos.slice(0, 3),
  currentVideoId: "v1",
  playbackStatus: "paused" as const,
  playbackPosition: 64,
  invited: true,
  messages: [
    {
      id: "m0",
      memberId: null,
      body: "Nadia bergabung ke room",
      isSystem: true,
      createdAt: "20:01",
    },
    {
      id: "m1",
      memberId: "nadia",
      body: "Adegan tadi bikin merinding 😱",
      isSystem: false,
      createdAt: "20:02",
    },
    {
      id: "m2",
      memberId: "ayu",
      body: "Sabar ya, aku mau pindah ke video berikutnya dulu 🙏",
      isSystem: false,
      createdAt: "20:02",
    },
    {
      id: "m3",
      memberId: "rizky",
      body: "Oke, kita lanjut 5 menit lagi ya!",
      isSystem: false,
      createdAt: "20:03",
    },
  ],
};
const roomSeeds: Room[] = [
  {
    ...base,
    id: "r1",
    code: "NG7KQ2XR",
    name: "Malam Minggu Nonton Film Indonesia",
    privacy: "unlisted",
    memberCount: 18,
    ownerName: "Rizky Pratama",
    image: photos.city,
    category: "Film Indonesia",
  },
  {
    ...base,
    id: "r2",
    code: "AN4BT9LM",
    name: "Maraton Anime Musim Panas",
    privacy: "public",
    memberCount: 42,
    ownerName: "Sari Wulandari",
    image: photos.anime,
    category: "Anime",
    members: members.map((m) => ({
      ...m,
      role: m.id === "rizky" ? "member" : m.id === "ayu" ? "owner" : m.role,
      displayName: m.id === "ayu" ? "Sari Wulandari" : m.displayName,
    })),
    controlMode: "everyone",
  },
  {
    ...base,
    id: "r3",
    code: "PD8WZ3HF",
    name: "Belajar Bareng Review Podcast Teknologi",
    privacy: "private",
    memberCount: 6,
    ownerName: "Dimas Kurniawan",
    image: photos.code,
    category: "Teknologi",
    hasPassword: true,
    invited: false,
  },
  {
    ...base,
    id: "r4",
    code: "MU6RC8YT",
    name: "Teman Begadang & Musik Akustik",
    privacy: "public",
    memberCount: 12,
    ownerName: "Ayu Lestari",
    image: photos.music,
    category: "Musik",
    controlMode: "everyone",
  },
  {
    ...base,
    id: "r5",
    code: "JV3NS7KP",
    name: "Keliling Nusantara dari Rumah",
    privacy: "public",
    memberCount: 9,
    ownerName: "Nadia Putri",
    image: photos.travel,
    category: "Jalan-jalan",
    controlMode: "moderators",
  },
];
// Lengkapi anggota dummy agar jumlah online sesuai angka contoh di Bab 9.
const extraNames = [
  "Aditya",
  "Intan",
  "Rafi",
  "Dewi",
  "Reza",
  "Citra",
  "Arif",
  "Wulan",
  "Hendra",
  "Fitri",
  "Bagas",
  "Tiara",
  "Yusuf",
  "Laras",
  "Bayu",
  "Nisa",
  "Gilang",
  "Putri",
  "Rama",
  "Anindya",
];
const extraSurnames = [
  "Saputra",
  "Permata",
  "Wijaya",
  "Maharani",
  "Ramadhan",
  "Anggraini",
  "Nugroho",
  "Puspita",
  "Firmansyah",
  "Rahmawati",
  "Prakoso",
  "Safitri",
  "Maulana",
  "Kusuma",
  "Setiawan",
  "Aulia",
  "Pradana",
  "Utami",
  "Wicaksono",
  "Kartika",
];
export const mockRooms: Room[] = roomSeeds.map((room) => {
  const seeded = room.members.map((m) => ({
    ...m,
    role: (m.displayName === room.ownerName
      ? "owner"
      : m.role === "owner"
        ? "member"
        : m.role) as Member["role"],
  }));
  if (!seeded.some((m) => m.role === "owner"))
    seeded.unshift({
      id: `owner-${room.id}`,
      displayName: room.ownerName,
      avatarUrl: "https://i.pravatar.cc/100?img=11",
      role: "owner",
      isMuted: false,
      online: true,
    });
  let index = 0;
  while (seeded.filter((m) => m.online).length < room.memberCount) {
    seeded.push({
      id: `${room.id}-member-${index}`,
      displayName: `${extraNames[index % 20]} ${extraSurnames[(index + Math.floor(index / 20)) % 20]}`,
      avatarUrl: `https://i.pravatar.cc/100?img=${((index + 15) % 60) + 1}`,
      role: "member",
      isMuted: false,
      online: true,
    });
    index++;
  }
  return { ...room, members: seeded };
});
export const mockPlaylists: Playlist[] = [
  {
    id: "film-akhir-pekan",
    name: "Film Akhir Pekan",
    videos: [videos[0], videos[2]],
    updatedAt: "2026-10-15",
  },
  {
    id: "anime-favorit",
    name: "Anime Favorit Keluarga",
    videos: [
      {
        ...videos[0],
        id: "anime1",
        title: "Petualangan Musim Panas di Kota Kecil",
        thumbnailUrl: photos.anime,
      },
    ],
    updatedAt: "2026-10-14",
  },
  {
    id: "belajar-coding",
    name: "Materi Belajar Coding",
    videos: [videos[1]],
    updatedAt: "2026-10-13",
  },
];
export const mockHistory: History[] = [
  {
    id: "h1",
    roomId: "r1",
    roomName: mockRooms[0].name,
    video: { ...videos[0], title: "Review Film Horor Indonesia Terbaru" },
    watchedSeconds: 960,
    watchedAt: "2026-10-16T12:15:00+07:00",
  },
  {
    id: "h2",
    roomId: "r3",
    roomName: mockRooms[2].name,
    video: videos[1],
    watchedSeconds: 1125,
    watchedAt: "2026-10-15T20:30:00+07:00",
  },
  {
    id: "h3",
    roomId: "r5",
    roomName: mockRooms[4].name,
    video: videos[2],
    watchedSeconds: 1200,
    watchedAt: "2026-10-14T19:00:00+07:00",
  },
];
