/**
 * Per-page dictionaries, kept separate from `../dictionaries.ts` (the
 * persistent chrome — sidebar/topbar/mobile-nav/app-shell — already
 * shipped and consumed as `t.nav`/`t.accountMenu`/etc.) so translating
 * one page never means editing a single shared file every other page's
 * translation also touches. Each domain file exports an `ar` object (the
 * source of truth, unchanged from what shipped before translation) and
 * an `en` object whose type is checked against it, so a missing English
 * key is a compile error instead of a silent fallback to Arabic text.
 */
import { commonAr, commonEn } from './common';
import { dashboardHomeAr, dashboardHomeEn } from './dashboard-home';
import { leadsAr, leadsEn } from './leads';
import { propertiesAr, propertiesEn } from './properties';
import { buildingsAr, buildingsEn } from './buildings';
import { projectsAr, projectsEn } from './projects';
import { rentalsAr, rentalsEn } from './rentals';
import { teamAr, teamEn } from './team';
import { settingsAr, settingsEn } from './settings';
import { billingAr, billingEn } from './billing';
import { websiteAr, websiteEn } from './website';
import { domainAr, domainEn } from './domain';
import { appsAr, appsEn } from './apps';
import { brokerMarketerAr, brokerMarketerEn } from './broker-marketer';
import { authAr, authEn } from './auth';
import type { Locale } from '../locale';

export const pageDictionaries = {
  ar: {
    common: commonAr,
    dashboardHome: dashboardHomeAr,
    leads: leadsAr,
    properties: propertiesAr,
    buildings: buildingsAr,
    projects: projectsAr,
    rentals: rentalsAr,
    team: teamAr,
    settings: settingsAr,
    billing: billingAr,
    website: websiteAr,
    domain: domainAr,
    apps: appsAr,
    brokerMarketer: brokerMarketerAr,
    auth: authAr,
  },
  en: {
    common: commonEn,
    dashboardHome: dashboardHomeEn,
    leads: leadsEn,
    properties: propertiesEn,
    buildings: buildingsEn,
    projects: projectsEn,
    rentals: rentalsEn,
    team: teamEn,
    settings: settingsEn,
    billing: billingEn,
    website: websiteEn,
    domain: domainEn,
    apps: appsEn,
    brokerMarketer: brokerMarketerEn,
    auth: authEn,
  },
} satisfies Record<Locale, unknown>;

export type PageDictionaries = (typeof pageDictionaries)['ar'];
