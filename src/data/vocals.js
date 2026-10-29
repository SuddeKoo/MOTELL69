// Oppdatering 1.2: små, naturlige vokallyder (ingen opplesning, ingen lyd per bokstav).
// Hver profil sier hvor ofte en karakter lager lyd i fire situasjoner, og hvilke typer lyd som passer.
// p = sannsynlighet, mix = vekter per lydtype. Lydtyper: throat (kremt), hmm, nod (kort «mm»), sigh (sukk),
// laugh (humring), breath (pust), sniff (snufs), grunt (lavt grynt), nervous (nervøs utpust), surprise.
// rate = avspillingsfart (små justeringer, aldri ekstreme).
// Profilen velges per karakter-id, ellers per arketype, ellers «base». Kjønn styrer bare hvilket opptak som
// brukes, ikke hvor ofte en karakter lager lyd.

export const VOCAL_PROFILES = {
  base: {
    talk: { p: 0.3, mix: { hmm: 2, nod: 2, breath: 2, throat: 1 } },
    arrive: { p: 0.55, mix: { throat: 2, breath: 2, sniff: 1, hmm: 1, sigh: 1 } },
    approve: { p: 0.5, mix: { breath: 2, nod: 2, laugh: 1 } },
    deny: { p: 0.55, mix: { sigh: 3, hmm: 2, throat: 1 } },
  },
  // ── Hovedkarakterer ──
  tom: { rate: 0.94, talk: { p: 0.45, mix: { throat: 3, grunt: 3, hmm: 1 } }, arrive: { p: 0.8, mix: { throat: 3, grunt: 2 } }, approve: { p: 0.6, mix: { grunt: 2, laugh: 1 } }, deny: { p: 0.8, mix: { grunt: 3, throat: 2, sigh: 2 } } },
  konrad: { rate: 1.05, talk: { p: 0.45, mix: { breath: 3, nervous: 2, hmm: 1 } }, arrive: { p: 0.7, mix: { breath: 3, nervous: 2, throat: 1 } }, approve: { p: 0.8, mix: { breath: 4 } }, deny: { p: 0.7, mix: { nervous: 3, sigh: 2 } } },
  vebjorn: { rate: 1.08, talk: { p: 0.5, mix: { nod: 3, laugh: 2, breath: 2 } }, arrive: { p: 0.8, mix: { laugh: 2, nod: 2, breath: 2 } }, approve: { p: 0.8, mix: { laugh: 3 } }, deny: { p: 0.6, mix: { laugh: 2, surprise: 1 } } },
  ron: { rate: 0.92, talk: { p: 0.12, mix: { hmm: 3, breath: 1 } }, arrive: { p: 0.35, mix: { hmm: 2, breath: 2 } }, approve: { p: 0.25, mix: { hmm: 1 } }, deny: { p: 0.3, mix: { sigh: 1, hmm: 1 } } },
  jacob: { rate: 1.1, talk: { p: 0.4, mix: { laugh: 3, nod: 2 } }, arrive: { p: 0.7, mix: { laugh: 3, nod: 1 } }, approve: { p: 0.8, mix: { laugh: 3 } }, deny: { p: 0.6, mix: { laugh: 2, surprise: 1 } } },
  adrian: { rate: 0.93, talk: { p: 0.35, mix: { hmm: 4, breath: 1 } }, arrive: { p: 0.6, mix: { hmm: 3, sniff: 1 } }, approve: { p: 0.5, mix: { hmm: 2 } }, deny: { p: 0.6, mix: { hmm: 2, breath: 1 } } },
  arild: { rate: 1.0, talk: { p: 0.4, mix: { throat: 3, sigh: 2, hmm: 1 } }, arrive: { p: 0.7, mix: { throat: 3, sigh: 1 } }, approve: { p: 0.5, mix: { sigh: 2, hmm: 1 } }, deny: { p: 0.7, mix: { sigh: 3, throat: 2 } } },
  daniel: { rate: 1.0, talk: { p: 0.35, mix: { breath: 4, laugh: 1 } }, arrive: { p: 0.6, mix: { breath: 3, nod: 1 } }, approve: { p: 0.6, mix: { breath: 2, laugh: 1 } }, deny: { p: 0.5, mix: { breath: 3 } } },
  lina: { rate: 1.0, talk: { p: 0.3, mix: { hmm: 2, laugh: 2, nod: 1 } }, arrive: { p: 0.5, mix: { throat: 1, sniff: 1, hmm: 1 } }, approve: { p: 0.6, mix: { laugh: 2, nod: 1 } }, deny: { p: 0.7, mix: { sigh: 3, hmm: 1 } } },
  // ── Arketyper for ekstra-NPC-er ──
  grumpy: { rate: 0.94, talk: { p: 0.4, mix: { throat: 2, grunt: 2, sigh: 2 } }, arrive: { p: 0.75, mix: { throat: 2, grunt: 2, sigh: 1 } }, approve: { p: 0.4, mix: { grunt: 1, hmm: 1 } }, deny: { p: 0.8, mix: { sigh: 2, grunt: 2 } } },
  polite: { talk: { p: 0.25, mix: { throat: 2, hmm: 2 } }, arrive: { p: 0.6, mix: { throat: 3, breath: 1 } }, approve: { p: 0.5, mix: { nod: 2, breath: 1 } }, deny: { p: 0.5, mix: { sigh: 1, hmm: 2 } } },
  cute: { rate: 1.04, talk: { p: 0.35, mix: { laugh: 3, nod: 2 } }, arrive: { p: 0.6, mix: { laugh: 2, nod: 2 } }, approve: { p: 0.7, mix: { laugh: 3 } }, deny: { p: 0.6, mix: { sigh: 2, sniff: 2 } } },
  chaotic: { rate: 1.06, talk: { p: 0.45, mix: { laugh: 3, nod: 1, breath: 1 } }, arrive: { p: 0.7, mix: { laugh: 2, breath: 2 } }, approve: { p: 0.8, mix: { laugh: 3 } }, deny: { p: 0.6, mix: { laugh: 2, surprise: 1 } } },
  dramatic: { talk: { p: 0.35, mix: { sigh: 3, breath: 2 } }, arrive: { p: 0.65, mix: { sigh: 3, breath: 1 } }, approve: { p: 0.5, mix: { breath: 2, sigh: 1 } }, deny: { p: 0.8, mix: { sigh: 4 } } },
  sleepy: { rate: 0.95, talk: { p: 0.35, mix: { breath: 3, sigh: 2 } }, arrive: { p: 0.65, mix: { breath: 3, sigh: 2 } }, approve: { p: 0.5, mix: { breath: 2 } }, deny: { p: 0.5, mix: { sigh: 2 } } },
  conspiracy: { talk: { p: 0.35, mix: { breath: 2, nervous: 1, hmm: 2 } }, arrive: { p: 0.6, mix: { sniff: 2, breath: 2 } }, approve: { p: 0.5, mix: { breath: 2 } }, deny: { p: 0.6, mix: { hmm: 2, sigh: 1 } } },
  // ── Nye i 1.2 ──
  eskil: { rate: 1.06, talk: { p: 0.45, mix: { grunt: 3, throat: 2, hmm: 1 } }, arrive: { p: 0.8, mix: { grunt: 2, throat: 2, sniff: 1 } }, approve: { p: 0.5, mix: { grunt: 1, hmm: 1 } }, deny: { p: 0.85, mix: { grunt: 3, sigh: 1 } } },
  sigvart: { rate: 1.03, talk: { p: 0.45, mix: { breath: 3, hmm: 2, nervous: 1 } }, arrive: { p: 0.7, mix: { breath: 2, throat: 1, nervous: 1 } }, approve: { p: 0.8, mix: { breath: 3 } }, deny: { p: 0.6, mix: { nervous: 2, sigh: 2 } } },
  sakarias: { rate: 0.94, talk: { p: 0.35, mix: { hmm: 3, laugh: 1 } }, arrive: { p: 0.6, mix: { sniff: 2, hmm: 2 } }, approve: { p: 0.5, mix: { hmm: 2, laugh: 1 } }, deny: { p: 0.6, mix: { laugh: 1, hmm: 2 } } },
};

/** Profil for en karakter: egen profil > arketype > base. Manglende situasjoner arves fra base. */
export function vocalProfile(ch) {
  const own = VOCAL_PROFILES[ch.id] || VOCAL_PROFILES[ch.arch] || {};
  return { ...VOCAL_PROFILES.base, ...own };
}

// Lydtype → opptak i lydpakken. Noen typer finnes bare for den ene stemmetypen; da brukes nærmeste.
export function vocalSound(kind, type) {
  const t = type === 'f' ? 'f' : 'm';
  if (kind === 'sniff') return t === 'f' ? 'f_sniff' : 'm_breath';
  return `${t}_${kind}`;
}
