"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { cardLink, secondaryButton, spriteBox } from "@/components/ui";
import type { HomeGeneration } from "@/lib/data/games";
import { useGameStore } from "@/store/game-store";

const navButton = `${secondaryButton} size-11 px-0`;

/**
 * Frise des générations de l'accueil : une étape par génération (chiffre romain + région), et sous la frise
 * les jeux de l'étape choisie. Elle s'ouvre sur la génération du jeu en cours, à défaut sur la plus récente.
 */
export function GameTimeline({ generations }: { generations: HomeGeneration[] }) {
  const current = useGameStore((state) => state.game);
  const currentIndex = current ? generations.findIndex((g) => g.games.some((v) => v.slug === current.slug)) : -1;
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked ?? (currentIndex >= 0 ? currentIndex : generations.length - 1);
  const generation = generations[selected];
  const count = generation.games.length;

  // Sur mobile, la frise défile : on y garde l'étape choisie en vue.
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rail = railRef.current;
    const step = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!rail || !step || rail.scrollWidth <= rail.clientWidth) return;
    const offset = step.getBoundingClientRect().left - rail.getBoundingClientRect().left;
    rail.scrollTo({ left: rail.scrollLeft + offset - (rail.clientWidth - step.offsetWidth) / 2, behavior: picked === null ? "instant" : "smooth" });
  }, [selected, picked]);

  const half = `calc(100% / ${generations.length * 2})`;

  return (
    <section id="jeux" className="scroll-mt-24 space-y-5 sm:space-y-7">
      <h2 className="t-h2">{current ? "Choisir un autre jeu" : "Choisir un jeu"}</h2>

      <div ref={railRef} className="-mx-5 overflow-x-auto px-5 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div
          role="group"
          aria-label="Générations"
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${generations.length}, minmax(0, 1fr))`, minWidth: generations.length * 64 }}
        >
          {/* Le trait relie le centre de la première pastille à celui de la dernière. */}
          <span aria-hidden className="absolute top-[23px] h-0.5 bg-line sm:top-[27px]" style={{ left: half, right: half }} />
          {generations.map((g, index) => {
            const active = index === selected;
            const isCurrent = index === currentIndex;
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPicked(index)}
                className="group relative flex flex-col items-center gap-2 rounded-md sm:gap-2.5"
              >
                <span
                  className={`grid size-12 place-items-center rounded-full border-2 text-[15px] font-extrabold tracking-[-0.02em] shadow-[0_0_0_4px_var(--bg)] transition-colors sm:size-14 sm:text-[17px] ${active ? "border-ink bg-ink text-on-ink" : "border-line-strong bg-page text-ink group-hover:border-ink"
                    }`}
                >
                  {g.numeral}
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-xs leading-4 font-bold sm:text-sm sm:leading-5">{g.region}</span>
                  {isCurrent && (
                    <>
                      <span aria-hidden className="mt-1 size-1.5 rounded-full bg-ink sm:hidden" />
                      <span className="sr-only sm:not-sr-only sm:mt-1 sm:inline-flex sm:h-5 sm:items-center sm:rounded-full sm:bg-ink sm:px-2 sm:text-[10px] sm:font-bold sm:tracking-[0.06em] sm:text-on-ink sm:uppercase">
                        En cours
                      </span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-10">
        <div className="flex items-end gap-3 lg:w-56 lg:shrink-0 lg:flex-col lg:items-start lg:gap-1">
          <span aria-hidden className="text-[56px] leading-[52px] font-extrabold tracking-[-0.05em] text-ink-3 lg:text-[96px] lg:leading-[88px]">
            {generation.numeral}
          </span>
          <div className="min-w-0 flex-1 lg:mt-3 lg:flex-none">
            <h3 className="text-2xl leading-[30px] font-extrabold tracking-[-0.02em] lg:text-[32px] lg:leading-[38px]">{generation.region}</h3>
            <p className="t-small text-ink-2">
              Génération {generation.numeral} · {count} jeu{count > 1 ? "x" : ""}
            </p>
          </div>
          <div className="flex gap-1 lg:mt-4">
            <button type="button" aria-label="Génération précédente" disabled={selected === 0} onClick={() => setPicked(selected - 1)} className={navButton}>
              <ChevronLeftIcon size={20} />
            </button>
            <button
              type="button"
              aria-label="Génération suivante"
              disabled={selected === generations.length - 1}
              onClick={() => setPicked(selected + 1)}
              className={navButton}
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>

        <ul className="grid flex-1 grid-cols-2 content-start gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] sm:gap-3">
          {generation.games.map((game) => {
            const isCurrent = current?.slug === game.slug;
            return (
              <li key={game.slug}>
                <Link
                  href={`/jeu/${game.slug}`}
                  className={`flex h-full flex-col gap-2 p-2.5 pb-3 sm:gap-2.5 sm:p-3 sm:pb-3.5 ${isCurrent ? "rounded-lg border-2 border-ink bg-surface" : cardLink
                    }`}
                >
                  <span className={`${spriteBox} aspect-square w-full`}>
                    {game.mascot !== null && <PokemonSprite pokemonId={game.mascot} alt="" size={160} className="size-[78%] object-contain" />}
                  </span>
                  <span className="flex flex-col px-0.5">
                    <span className="leading-5 font-bold sm:leading-6">{game.nameFr}</span>
                    {(isCurrent) && (
                      <span className="text-xs leading-[18px] text-ink-2 sm:t-small">En cours</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
