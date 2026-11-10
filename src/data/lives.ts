// ==========================================================================
// Room 33 — Les lives (vidéos YouTube). DÉMO : à remplacer par tes lives
// (depuis /admin au lot A). Le premier de la liste est « à la une ».
// youtube = identifiant de la vidéo (la partie après « v= » dans l'adresse).
// ==========================================================================
export interface Live {
  youtube: string;
  artiste: string;
  titre: string;
  lieu: string;      // émission, lieu, ville
  annee: number;
  mot: string;       // ton mot (une à trois phrases)
  disque?: string;   // slug d'un disque de tes bacs, pour « Voir le disque »
}

export const lives: Live[] = [
  { youtube: '2eXGtT7E5aU', artiste: 'Tom Misch & Yussef Dayes', titre: 'Tiny Desk (Home) Concert', lieu: 'NPR Music · Londres', annee: 2020, mot: '« Mon mot sur ce live, en deux ou trois phrases : pourquoi je le repasse en boucle, la minute où tout bascule. »', disque: 'tom-misch-geography' },
  { youtube: 'PBKa-AAy_vo', artiste: 'Daniel Caesar', titre: 'Tiny Desk Concert', lieu: 'NPR Music · Washington', annee: 2018, mot: '« Une phrase sur ce live : le moment qui me retourne. »', disque: 'daniel-caesar-freudian' },
  { youtube: 'BnEgnrUCXPY', artiste: 'The Yussef Dayes Experience', titre: 'Live from Malibu', lieu: 'Malibu', annee: 2023, mot: '« Une phrase sur ce live : le moment qui me retourne. »', disque: 'yussef-dayes-black-classical-music' },
  { youtube: 'Yy4pcKn0Y_k', artiste: 'The Yussef Dayes Experience', titre: 'Live at Joshua Tree', lieu: 'Soulection · Joshua Tree', annee: 2022, mot: '« Une phrase sur ce live : le moment qui me retourne. »' },
];
