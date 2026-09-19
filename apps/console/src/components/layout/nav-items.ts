import type { ComponentType } from 'react';
import { AccountsIcon, CitiesIcon, DistrictsIcon, FaqIcon, PlansIcon, SettingsIcon, SupportIcon, ThemesIcon } from './nav-icons';

type Icon = ComponentType<{ className?: string }>;
export interface NavLeaf { href:string; label:string; icon:Icon }
export interface NavGroup { group:string; label:string; icon:Icon; children:NavLeaf[] }
export type NavEntry=NavLeaf|NavGroup;
export const isNavGroup=(entry:NavEntry):entry is NavGroup=>'children' in entry;

/**
 * Platform-owner information architecture. Related records live together:
 * customers/operations, commercial configuration, landing content, and
 * geographic data. Settings stays outside the main nav and is pinned in
 * the account/mobile chrome, matching the tenant dashboard.
 */
export const NAV_ITEMS:NavEntry[]=[
 {href:'/',label:'نظرة عامة',icon:AccountsIcon},
 {group:'customers',label:'العملاء والتشغيل',icon:AccountsIcon,children:[
  {href:'/accounts',label:'الحسابات',icon:AccountsIcon},
  {href:'/operations',label:'تشغيل المنصة',icon:AccountsIcon},
  {href:'/support',label:'التذاكر والدعم',icon:SupportIcon},
 ]},
 {group:'commercial',label:'المنتج والاشتراكات',icon:PlansIcon,children:[
  {href:'/plans',label:'الباقات',icon:PlansIcon},
  {href:'/themes',label:'الثيمات',icon:ThemesIcon},
 ]},
 {group:'content',label:'محتوى المنصة',icon:FaqIcon,children:[
  {href:'/faqs',label:'الأسئلة الشائعة',icon:FaqIcon},
 ]},
 {group:'locations',label:'المواقع الجغرافية',icon:CitiesIcon,children:[
  {href:'/cities',label:'المدن',icon:CitiesIcon},
  {href:'/districts',label:'الأحياء',icon:DistrictsIcon},
 ]},
];

export const SETTINGS_ITEM:NavLeaf={href:'/settings',label:'إعدادات المنصة',icon:SettingsIcon};
