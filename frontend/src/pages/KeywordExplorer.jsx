import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config/apiConfig';

const COUNTRY_DB = [
  { code: 'af', name: 'Afghanistan', flag: '🇦🇫', tld: 'google.com.af' },
  { code: 'al', name: 'Albania', flag: '🇦🇱', tld: 'google.al' },
  { code: 'dz', name: 'Algeria', flag: '🇩🇿', tld: 'google.dz' },
  { code: 'as', name: 'American Samoa', flag: '🇦🇸', tld: 'google.as' },
  { code: 'ad', name: 'Andorra', flag: '🇦🇩', tld: 'google.ad' },
  { code: 'ao', name: 'Angola', flag: '🇦🇴', tld: 'google.co.ao' },
  { code: 'ai', name: 'Anguilla', flag: '🇦🇮', tld: 'google.com.ai' },
  { code: 'ag', name: 'Antigua and Barbuda', flag: '🇦🇬', tld: 'google.com.ag' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷', tld: 'google.com.ar' },
  { code: 'am', name: 'Armenia', flag: '🇦🇲', tld: 'google.am' },
  { code: 'au', name: 'Australia', flag: '🇦🇺', tld: 'google.com.au' },
  { code: 'at', name: 'Austria', flag: '🇦🇹', tld: 'google.at' },
  { code: 'az', name: 'Azerbaijan', flag: '🇦🇿', tld: 'google.az' },
  { code: 'bs', name: 'Bahamas', flag: '🇧🇸', tld: 'google.bs' },
  { code: 'bh', name: 'Bahrain', flag: '🇧🇭', tld: 'google.com.bh' },
  { code: 'bd', name: 'Bangladesh', flag: '🇧🇩', tld: 'google.com.bd' },
  { code: 'bb', name: 'Barbados', flag: '🇧🇧', tld: 'google.com.bb' },
  { code: 'by', name: 'Belarus', flag: '🇧🇾', tld: 'google.by' },
  { code: 'be', name: 'Belgium', flag: '🇧🇪', tld: 'google.be' },
  { code: 'bz', name: 'Belize', flag: '🇧🇿', tld: 'google.com.bz' },
  { code: 'bj', name: 'Benin', flag: '🇧🇯', tld: 'google.bj' },
  { code: 'bm', name: 'Bermuda', flag: '🇧🇲', tld: 'google.com.bm' },
  { code: 'bt', name: 'Bhutan', flag: '🇧🇹', tld: 'google.bt' },
  { code: 'bo', name: 'Bolivia', flag: '🇧🇴', tld: 'google.com.bo' },
  { code: 'ba', name: 'Bosnia and Herzegovina', flag: '🇧🇦', tld: 'google.ba' },
  { code: 'bw', name: 'Botswana', flag: '🇧🇼', tld: 'google.co.bw' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷', tld: 'google.com.br' },
  { code: 'vg', name: 'British Virgin Islands', flag: '🇻🇬', tld: 'google.vg' },
  { code: 'bn', name: 'Brunei', flag: '🇧🇳', tld: 'google.com.bn' },
  { code: 'bg', name: 'Bulgaria', flag: '🇧🇬', tld: 'google.bg' },
  { code: 'bf', name: 'Burkina Faso', flag: '🇧🇫', tld: 'google.bf' },
  { code: 'bi', name: 'Burundi', flag: '🇧🇮', tld: 'google.bi' },
  { code: 'kh', name: 'Cambodia', flag: '🇰🇭', tld: 'google.com.kh' },
  { code: 'cm', name: 'Cameroon', flag: '🇨🇲', tld: 'google.cm' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦', tld: 'google.ca' },
  { code: 'cv', name: 'Cape Verde', flag: '🇨🇻', tld: 'google.cv' },
  { code: 'cf', name: 'Central African Republic', flag: '🇨🇫', tld: 'google.cf' },
  { code: 'td', name: 'Chad', flag: '🇹🇩', tld: 'google.td' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱', tld: 'google.cl' },
  { code: 'cn', name: 'China', flag: '🇨🇳', tld: 'google.cn' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴', tld: 'google.com.co' },
  { code: 'cg', name: 'Congo', flag: '🇨🇬', tld: 'google.cg' },
  { code: 'ck', name: 'Cook Islands', flag: '🇨🇰', tld: 'google.co.ck' },
  { code: 'cr', name: 'Costa Rica', flag: '🇨🇷', tld: 'google.co.cr' },
  { code: 'hr', name: 'Croatia', flag: '🇭🇷', tld: 'google.hr' },
  { code: 'cu', name: 'Cuba', flag: '🇨🇺', tld: 'google.com.cu' },
  { code: 'cy', name: 'Cyprus', flag: '🇨🇾', tld: 'google.com.cy' },
  { code: 'cz', name: 'Czechia', flag: '🇨🇿', tld: 'google.cz' },
  { code: 'dk', name: 'Denmark', flag: '🇩🇰', tld: 'google.dk' },
  { code: 'dj', name: 'Djibouti', flag: '🇩🇯', tld: 'google.dj' },
  { code: 'dm', name: 'Dominica', flag: '🇩🇲', tld: 'google.dm' },
  { code: 'do', name: 'Dominican Republic', flag: '🇩🇴', tld: 'google.com.do' },
  { code: 'ec', name: 'Ecuador', flag: '🇪🇨', tld: 'google.com.ec' },
  { code: 'eg', name: 'Egypt', flag: '🇪🇬', tld: 'google.com.eg' },
  { code: 'sv', name: 'El Salvador', flag: '🇸🇻', tld: 'google.com.sv' },
  { code: 'ee', name: 'Estonia', flag: '🇪🇪', tld: 'google.ee' },
  { code: 'et', name: 'Ethiopia', flag: '🇪🇹', tld: 'google.com.et' },
  { code: 'fj', name: 'Fiji', flag: '🇫🇯', tld: 'google.com.fj' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮', tld: 'google.fi' },
  { code: 'fr', name: 'France', flag: '🇫🇷', tld: 'google.fr' },
  { code: 'ga', name: 'Gabon', flag: '🇬🇦', tld: 'google.ga' },
  { code: 'gm', name: 'Gambia', flag: '🇬🇲', tld: 'google.gm' },
  { code: 'ge', name: 'Georgia', flag: '🇬🇪', tld: 'google.ge' },
  { code: 'de', name: 'Germany', flag: '🇩🇪', tld: 'google.de' },
  { code: 'gh', name: 'Ghana', flag: '🇬🇭', tld: 'google.com.gh' },
  { code: 'gi', name: 'Gibraltar', flag: '🇬🇮', tld: 'google.com.gi' },
  { code: 'gr', name: 'Greece', flag: '🇬🇷', tld: 'google.gr' },
  { code: 'gl', name: 'Greenland', flag: '🇬🇱', tld: 'google.gl' },
  { code: 'gd', name: 'Grenada', flag: '🇬🇩', tld: 'google.gd' },
  { code: 'gp', name: 'Guadeloupe', flag: '🇬🇵', tld: 'google.gp' },
  { code: 'gt', name: 'Guatemala', flag: '🇬🇹', tld: 'google.com.gt' },
  { code: 'gy', name: 'Guyana', flag: '🇬🇾', tld: 'google.gy' },
  { code: 'ht', name: 'Haiti', flag: '🇭🇹', tld: 'google.ht' },
  { code: 'hn', name: 'Honduras', flag: '🇭🇳', tld: 'google.hn' },
  { code: 'hk', name: 'Hong Kong', flag: '🇭🇰', tld: 'google.com.hk' },
  { code: 'hu', name: 'Hungary', flag: '🇭🇺', tld: 'google.hu' },
  { code: 'is', name: 'Iceland', flag: '🇮🇸', tld: 'google.is' },
  { code: 'in', name: 'India', flag: '🇮🇳', tld: 'google.co.in' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩', tld: 'google.co.id' },
  { code: 'iq', name: 'Iraq', flag: '🇮🇶', tld: 'google.com.iq' },
  { code: 'ie', name: 'Ireland', flag: '🇮🇪', tld: 'google.ie' },
  { code: 'im', name: 'Isle of Man', flag: '🇮🇲', tld: 'google.im' },
  { code: 'il', name: 'Israel', flag: '🇮🇱', tld: 'google.co.il' },
  { code: 'it', name: 'Italy', flag: '🇮🇹', tld: 'google.it' },
  { code: 'ci', name: 'Ivory Coast', flag: '🇨🇮', tld: 'google.ci' },
  { code: 'jm', name: 'Jamaica', flag: '🇯🇲', tld: 'google.com.jm' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵', tld: 'google.co.jp' },
  { code: 'je', name: 'Jersey', flag: '🇯🇪', tld: 'google.je' },
  { code: 'jo', name: 'Jordan', flag: '🇯🇴', tld: 'google.jo' },
  { code: 'kz', name: 'Kazakhstan', flag: '🇰🇿', tld: 'google.kz' },
  { code: 'ke', name: 'Kenya', flag: '🇰🇪', tld: 'google.co.ke' },
  { code: 'ki', name: 'Kiribati', flag: '🇰🇮', tld: 'google.ki' },
  { code: 'kw', name: 'Kuwait', flag: '🇰🇼', tld: 'google.com.kw' },
  { code: 'ky', name: 'Kyrgyzstan', flag: '🇰🇬', tld: 'google.kg' },
  { code: 'la', name: 'Laos', flag: '🇱🇦', tld: 'google.la' },
  { code: 'lv', name: 'Latvia', flag: '🇱🇻', tld: 'google.lv' },
  { code: 'lb', name: 'Lebanon', flag: '🇱🇧', tld: 'google.com.lb' },
  { code: 'ls', name: 'Lesotho', flag: '🇱🇸', tld: 'google.co.ls' },
  { code: 'ly', name: 'Libya', flag: '🇱🇾', tld: 'google.com.ly' },
  { code: 'li', name: 'Liechtenstein', flag: '🇱🇮', tld: 'google.li' },
  { code: 'lt', name: 'Lithuania', flag: '🇱🇹', tld: 'google.lt' },
  { code: 'lu', name: 'Luxembourg', flag: '🇱🇺', tld: 'google.lu' },
  { code: 'mk', name: 'Macedonia', flag: '🇲🇰', tld: 'google.mk' },
  { code: 'mg', name: 'Madagascar', flag: '🇲🇬', tld: 'google.mg' },
  { code: 'mw', name: 'Malawi', flag: '🇲🇼', tld: 'google.mw' },
  { code: 'my', name: 'Malaysia', flag: '🇲🇾', tld: 'google.com.my' },
  { code: 'mv', name: 'Maldives', flag: '🇲🇻', tld: 'google.mv' },
  { code: 'ml', name: 'Mali', flag: '🇲🇱', tld: 'google.ml' },
  { code: 'mt', name: 'Malta', flag: '🇲🇹', tld: 'google.com.mt' },
  { code: 'mu', name: 'Mauritius', flag: '🇲🇺', tld: 'google.mu' },
  { code: 'mx', name: 'Mexico', flag: '🇲🇽', tld: 'google.com.mx' },
  { code: 'fm', name: 'Micronesia', flag: '🇫🇲', tld: 'google.fm' },
  { code: 'md', name: 'Moldova', flag: '🇲🇩', tld: 'google.md' },
  { code: 'mn', name: 'Mongolia', flag: '🇲🇳', tld: 'google.mn' },
  { code: 'me', name: 'Montenegro', flag: '🇲🇪', tld: 'google.me' },
  { code: 'ms', name: 'Montserrat', flag: '🇲🇸', tld: 'google.ms' },
  { code: 'ma', name: 'Morocco', flag: '🇲🇦', tld: 'google.co.ma' },
  { code: 'mz', name: 'Mozambique', flag: '🇲🇿', tld: 'google.co.mz' },
  { code: 'mm', name: 'Myanmar', flag: '🇲🇲', tld: 'google.com.mm' },
  { code: 'na', name: 'Namibia', flag: '🇳🇦', tld: 'google.com.na' },
  { code: 'nr', name: 'Nauru', flag: '🇳🇷', tld: 'google.nr' },
  { code: 'np', name: 'Nepal', flag: '🇳🇵', tld: 'google.com.np' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱', tld: 'google.nl' },
  { code: 'nz', name: 'New Zealand', flag: '🇳🇿', tld: 'google.co.nz' },
  { code: 'ni', name: 'Nicaragua', flag: '🇳🇮', tld: 'google.com.ni' },
  { code: 'ne', name: 'Niger', flag: '🇳🇪', tld: 'google.ne' },
  { code: 'ng', name: 'Nigeria', flag: '🇳🇬', tld: 'google.com.ng' },
  { code: 'nu', name: 'Niue', flag: '🇳🇺', tld: 'google.nu' },
  { code: 'nf', name: 'Norfolk Island', flag: '🇳🇫', tld: 'google.com.nf' },
  { code: 'no', name: 'Norway', flag: '🇳🇴', tld: 'google.no' },
  { code: 'om', name: 'Oman', flag: '🇴🇲', tld: 'google.com.om' },
  { code: 'pk', name: 'Pakistan', flag: '🇵🇰', tld: 'google.com.pk' },
  { code: 'ps', name: 'Palestine', flag: '🇵🇸', tld: 'google.ps' },
  { code: 'pa', name: 'Panama', flag: '🇵🇦', tld: 'google.com.pa' },
  { code: 'pg', name: 'Papua New Guinea', flag: '🇵🇬', tld: 'google.com.pg' },
  { code: 'py', name: 'Paraguay', flag: '🇵🇾', tld: 'google.com.py' },
  { code: 'pe', name: 'Peru', flag: '🇵🇪', tld: 'google.com.pe' },
  { code: 'ph', name: 'Philippines', flag: '🇵🇭', tld: 'google.com.ph' },
  { code: 'pn', name: 'Pitcairn Islands', flag: '🇵🇳', tld: 'google.pn' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱', tld: 'google.pl' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹', tld: 'google.pt' },
  { code: 'pr', name: 'Puerto Rico', flag: '🇵🇷', tld: 'google.com.pr' },
  { code: 'qa', name: 'Qatar', flag: '🇶🇦', tld: 'google.com.qa' },
  { code: 're', name: 'Reunion', flag: '🇷🇪', tld: 'google.re' },
  { code: 'ro', name: 'Romania', flag: '🇷🇴', tld: 'google.ro' },
  { code: 'ru', name: 'Russia', flag: '🇷🇺', tld: 'google.ru' },
  { code: 'rw', name: 'Rwanda', flag: '🇷🇼', tld: 'google.rw' },
  { code: 'sh', name: 'Saint Helena', flag: '🇸🇭', tld: 'google.sh' },
  { code: 'kn', name: 'Saint Kitts and Nevis', flag: '🇰🇳', tld: 'google.com.kn' },
  { code: 'lc', name: 'Saint Lucia', flag: '🇱🇨', tld: 'google.com.lc' },
  { code: 'vc', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', tld: 'google.com.vc' },
  { code: 'ws', name: 'Samoa', flag: '🇼🇸', tld: 'google.ws' },
  { code: 'sm', name: 'San Marino', flag: '🇸🇲', tld: 'google.sm' },
  { code: 'st', name: 'Sao Tome and Principe', flag: '🇸🇹', tld: 'google.st' },
  { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦', tld: 'google.com.sa' },
  { code: 'sn', name: 'Senegal', flag: '🇸🇳', tld: 'google.sn' },
  { code: 'rs', name: 'Serbia', flag: '🇷🇸', tld: 'google.rs' },
  { code: 'sc', name: 'Seychelles', flag: '🇸🇨', tld: 'google.sc' },
  { code: 'sl', name: 'Sierra Leone', flag: '🇸🇱', tld: 'google.com.sl' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬', tld: 'google.com.sg' },
  { code: 'sk', name: 'Slovakia', flag: '🇸🇰', tld: 'google.sk' },
  { code: 'si', name: 'Slovenia', flag: '🇸🇮', tld: 'google.si' },
  { code: 'sb', name: 'Solomon Islands', flag: '🇸🇧', tld: 'google.com.sb' },
  { code: 'so', name: 'Somalia', flag: '🇸🇴', tld: 'google.so' },
  { code: 'za', name: 'South Africa', flag: '🇿🇦', tld: 'google.co.za' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷', tld: 'google.co.kr' },
  { code: 'es', name: 'Spain', flag: '🇪🇸', tld: 'google.es' },
  { code: 'lk', name: 'Sri Lanka', flag: '🇱🇰', tld: 'google.lk' },
  { code: 'sd', name: 'Sudan', flag: '🇸🇩', tld: 'google.com.sd' },
  { code: 'sr', name: 'Suriname', flag: '🇸🇷', tld: 'google.sr' },
  { code: 'sz', name: 'Swaziland', flag: '🇸🇿', tld: 'google.co.sz' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪', tld: 'google.se' },
  { code: 'ch', name: 'Switzerland', flag: '🇨🇭', tld: 'google.ch' },
  { code: 'tw', name: 'Taiwan', flag: '🇹🇼', tld: 'google.com.tw' },
  { code: 'tj', name: 'Tajikistan', flag: '🇹🇯', tld: 'google.com.tj' },
  { code: 'tz', name: 'Tanzania', flag: '🇹🇿', tld: 'google.co.tz' },
  { code: 'th', name: 'Thailand', flag: '🇹🇭', tld: 'google.co.th' },
  { code: 'tl', name: 'Timor-Leste', flag: '🇹🇱', tld: 'google.tl' },
  { code: 'tg', name: 'Togo', flag: '🇹🇬', tld: 'google.tg' },
  { code: 'tk', name: 'Tokelau', flag: '🇹🇰', tld: 'google.tk' },
  { code: 'to', name: 'Tonga', flag: '🇹🇴', tld: 'google.to' },
  { code: 'tt', name: 'Trinidad and Tobago', flag: '🇹🇹', tld: 'google.tt' },
  { code: 'tn', name: 'Tunisia', flag: '🇹🇳', tld: 'google.tn' },
  { code: 'tr', name: 'Turkey', flag: '🇹🇷', tld: 'google.com.tr' },
  { code: 'tm', name: 'Turkmenistan', flag: '🇹🇲', tld: 'google.tm' },
  { code: 'vi', name: 'U.S. Virgin Islands', flag: '🇻🇮', tld: 'google.co.vi' },
  { code: 'ug', name: 'Uganda', flag: '🇺🇬', tld: 'google.co.ug' },
  { code: 'ua', name: 'Ukraine', flag: '🇺🇦', tld: 'google.com.ua' },
  { code: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', tld: 'google.ae' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', tld: 'google.co.uk' },
  { code: 'us', name: 'United States', flag: '🇺🇸', tld: 'google.com' },
  { code: 'uy', name: 'Uruguay', flag: '🇺🇾', tld: 'google.com.uy' },
  { code: 'uz', name: 'Uzbekistan', flag: '🇺🇿', tld: 'google.co.uz' },
  { code: 'vu', name: 'Vanuatu', flag: '🇻🇺', tld: 'google.vu' },
  { code: 've', name: 'Venezuela', flag: '🇻🇪', tld: 'google.co.ve' },
  { code: 'vn', name: 'Vietnam', flag: '🇻🇳', tld: 'google.com.vn' },
  { code: 'zm', name: 'Zambia', flag: '🇿🇲', tld: 'google.co.zm' },
  { code: 'zw', name: 'Zimbabwe', flag: '🇿🇼', tld: 'google.co.zw' }
];

const KeywordExplorer = () => {
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('us');
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isDeep, setIsDeep] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);
  
  const cityDropdownRef = useRef(null);

  // UULE Encoding Logic
  const getUULE = (canonical) => {
    if (!canonical) return '';
    const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const key = UULE_CHARS[canonical.length] || 'A';
    const uuleEncoded = btoa(unescape(encodeURIComponent(canonical))).replace(/=/g, '');
    return `w+CAIQICI${key}${uuleEncoded}`;
  };

  const getIntent = (s) => {
    const low = s.toLowerCase();
    if (low.includes('buy') || low.includes('price') || low.includes('cost') || low.includes('cheap') || low.includes('order') || low.includes('hire')) return 'Transactional';
    if (low.includes('best') || low.includes('top') || low.includes('review') || low.includes('vs') || low.includes('compare')) return 'Commercial';
    if (low.includes('how') || low.includes('what') || low.includes('why') || low.includes('guide') || low.includes('tutorial') || low.includes('tips')) return 'Informational';
    if (low.includes('near me') || low.includes('service') || low.includes('shop') || low.includes('store') || low.includes('office')) return 'Local';
    return 'Navigational';
  };

  useEffect(() => {
    if (city.length < 2) {
      setCitySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        const countryParam = region ? `&countrycode=${region}` : '';
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(city)}${countryParam}&limit=10&lang=en&osm_tag=place`);
        const data = await res.json();
        const suggestions = data.features.map(f => {
          const p = f.properties;
          const parts = [p.name, p.city, p.state, p.country].filter(Boolean);
          return { display: [...new Set(parts)].join(', ') };
        });
        setCitySuggestions(suggestions);
      } catch (err) {
        console.error("City fetch failed", err);
      } finally {
        setIsCityLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [city, region]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!keyword) return;
    setLoading(true);
    setError('');
    try {
      const uule = city ? getUULE(city) : '';
      const uuleParam = uule ? `&uule=${uule}` : '';
      const response = await fetch(`${API_BASE_URL}/api/keywords/suggestions?q=${encodeURIComponent(keyword)}&gl=${region}&hl=en${uuleParam}&deep=${isDeep}`);
      const data = await response.json();
      if (data.success) {
        let finalSuggestions = data.suggestions.map(s => ({ text: s, intent: getIntent(s) }));
        if (city) {
          const selectedCityName = city.split(',')[0].toLowerCase().trim();
          const otherMajorCities = {
            au: ['sydney', 'brisbane', 'perth', 'adelaide'],
            in: ['delhi', 'mumbai', 'bangalore', 'pune', 'chennai', 'hyderabad', 'kolkata', 'faridabad', 'noida', 'ghaziabad'],
            us: ['new york', 'los angeles', 'chicago'],
            gb: ['london', 'birmingham', 'manchester']
          };
          const excludeList = (otherMajorCities[region] || []).filter(c => !selectedCityName.includes(c) && !c.includes(selectedCityName));
          finalSuggestions = finalSuggestions.filter(s => {
            const lowS = s.text.toLowerCase();
            if (lowS.includes(selectedCityName)) return true;
            if (excludeList.some(ex => lowS.includes(ex))) return false;
            return true;
          });
        }
        setResults({ ...data, suggestions: finalSuggestions, count: finalSuggestions.length });
      }
    } catch (err) {
      setError('Connection error. Server busy.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    const header = "Keyword,Intent\n";
    const body = results.suggestions.map(s => `"${s.text}","${s.intent}"`).join("\n");
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords_${keyword.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  const filteredSuggestions = results ? results.suggestions.filter(s => {
    if (activeTab === 'all') return true;
    return s.intent.toLowerCase() === activeTab.toLowerCase();
  }) : [];

  const faqs = [
    { q: "How does the City-Level Keyword Explorer work?", a: "Our tool uses UULE (Uniform User Locality Encoding) to simulate search results from specific geographic coordinates. This allows you to see the exact autocomplete suggestions that a person in that specific city would see." },
    { q: "What is Deep Alphabetical Discovery?", a: "This professional feature automatically appends letters (a-z) and SEO modifiers to your seed keyword. It performs up to 40 recursive searches to reveal hundreds of long-tail keywords that standard tools miss." },
    { q: "Is this keyword tool completely free?", a: "Yes, our Keyword Discovery Pro tool is free to use. We provide professional-grade localized data without the expensive subscription costs of premium SEO suites." },
    { q: "Why should I care about Keyword Intent?", a: "Understanding intent (Transactional, Commercial, etc.) helps you choose keywords that actually convert. A 'Transactional' keyword like 'buy ac repair service' is much more valuable than a general 'ac repair' query." },
    { q: "Can I export my research to Excel?", a: "Absolutely! We provide a 'Export CSV' feature so you can download your entire keyword research report for further analysis in Excel, Google Sheets, or any other SEO tool." }
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Keyword Discovery Pro",
      "operatingSystem": "Web",
      "applicationCategory": "SEO Tool",
      "description": "Professional-grade free keyword research tool with city-level UULE precision and deep alphabetical discovery.",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": `${window.location.origin}/`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Keyword Explorer",
          "item": `${window.location.origin}/keywords`
        }
      ]
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Helmet>
        <title>Free Local Keyword Research Tool | City-Based Keyword Explorer</title>
        <meta name="description" content="Discover high-intent, localized keywords for any city globally. Use Deep Discovery and UULE precision to find hidden SEO opportunities for free." />
        <meta name="keywords" content="free keyword tool, localized seo, city based keyword research, uule generator, long tail keywords" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Navbar />

      <main style={{ padding: '160px 24px 100px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '5%', right: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          
          <header style={{ textAlign: 'center', marginBottom: '60px' }}>
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '10px 25px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginBottom: '25px' }}>
               <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 15px #3b82f6' }}></span>
               PROFESSIONAL SEO SUITE
             </motion.div>
             <h1 style={{ fontSize: 'clamp(32px, 6vw, 72px)', fontWeight: '900', letterSpacing: '-4px', lineHeight: '0.9', marginBottom: '30px' }}>Keyword <span style={{ color: 'var(--accent)' }}>Explorer.</span></h1>
             <p style={{ color: '#64748b', fontSize: '20px', fontWeight: '500', maxWidth: '700px', margin: '0 auto 50px' }}>Find high-performing, hyper-local keywords for any city in the world using advanced UULE technology.</p>
          </header>

          <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(40px)', padding: '40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', marginBottom: '50px' }}>
             <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 0.6fr auto', gap: '20px', alignItems: 'center' }}>
               <div style={{ position: 'relative' }}>
                 <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
                 <input type="text" placeholder="Enter Seed Keyword..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '20px 20px 20px 55px', fontSize: '16px', borderRadius: '20px', outline: 'none', fontWeight: '700' }} />
               </div>
               <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 5, pointerEvents: 'none' }}>{COUNTRY_DB.find(c => c.code === region)?.flag}</span>
                  <select value={region} onChange={(e) => { setRegion(e.target.value); setCity(''); }} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '18px 20px 18px 50px', fontSize: '14px', borderRadius: '20px', outline: 'none', fontWeight: '700', cursor: 'pointer', appearance: 'none' }}>
                    {COUNTRY_DB.map(c => <option key={c.code} value={c.code} style={{ background: '#0f172a' }}>{c.name}</option>)}
                  </select>
               </div>
               <div style={{ position: 'relative' }} ref={cityDropdownRef}>
                 <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>📍</span>
                 <input type="text" placeholder="Type City Name..." value={city} onFocus={() => setShowCityDropdown(true)} onChange={(e) => { setCity(e.target.value); setShowCityDropdown(true); }} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '18px 20px 18px 50px', fontSize: '14px', borderRadius: '20px', outline: 'none', fontWeight: '600' }} />
                 {showCityDropdown && citySuggestions.length > 0 && (
                   <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', marginTop: '10px', zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                     {citySuggestions.map((s, i) => (<div key={i} onClick={() => { setCity(s.display); setShowCityDropdown(false); }} style={{ padding: '12px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }} onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.target.style.background = 'transparent'}>{s.display}</div>))}
                   </div>
                 )}
               </div>
               <button disabled={loading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0 40px', height: '62px', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', transition: '0.3s', boxShadow: '0 15px 30px rgba(255,153,0,0.3)', fontSize: '16px' }}>{loading ? <span className="loader-small"></span> : 'DISCOVER'}</button>
             </form>
             <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', gap: '20px', paddingLeft: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: isDeep ? 'var(--accent)' : '#64748b' }}>
                  <input type="checkbox" checked={isDeep} onChange={() => setIsDeep(!isDeep)} style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }} />
                  DEEP DISCOVERY MODE (A-Z Expansion)
                </label>
             </div>
          </div>

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(15,23,42,0.3)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.04)', padding: '50px', marginBottom: '80px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '30px' }}>
                  <div><h3 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px' }}>Professional Report</h3><p style={{ color: '#64748b', fontSize: '15px', fontWeight: '600', margin: 0 }}>Found <span style={{ color: '#fff' }}>{results.count} Professional Variations</span> for "{results.query}"</p></div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 25px', borderRadius: '15px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>EXPORT CSV</button>
                    <button onClick={() => { navigator.clipboard.writeText(results.suggestions.map(s=>s.text).join('\n')); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} style={{ background: copied ? '#10b981' : '#fff', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '15px', fontSize: '14px', fontWeight: '900', cursor: 'pointer' }}>{copied ? '✓ COPIED' : 'COPY ALL'}</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  {['all', 'Informational', 'Commercial', 'Transactional', 'Local', 'Navigational'].map((tab) => {
                    const count = tab === 'all' ? results.suggestions.length : results.suggestions.filter(s => s.intent.toLowerCase() === tab.toLowerCase()).length;
                    const isActive = activeTab === tab;
                    return (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                          padding: '14px 28px', 
                          borderRadius: '18px', 
                          border: '1px solid',
                          borderColor: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                          background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#000' : '#f8fafc',
                          fontSize: '13px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: isActive ? '0 10px 20px rgba(255,153,0,0.2)' : 'none',
                          transform: isActive ? 'translateY(-2px)' : 'none'
                        }}
                        onMouseEnter={e => !isActive && (e.target.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={e => !isActive && (e.target.style.background = 'rgba(255,255,255,0.05)')}
                      >
                        {tab.toUpperCase()}
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '900',
                          background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,153,0,0.1)', 
                          color: isActive ? '#000' : 'var(--accent)', 
                          padding: '3px 10px', 
                          borderRadius: '100px',
                          minWidth: '24px',
                          textAlign: 'center'
                        }}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                  {filteredSuggestions.map((s, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ scale: 1.02, y: -5 }} 
                      style={{ 
                        background: 'rgba(15,23,42,0.6)', 
                        padding: '25px 30px', 
                        borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.06)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', color: 'var(--accent)', letterSpacing: '-0.3px' }}>{s.text}</div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '900', 
                            color: s.intent === 'Transactional' ? '#10b981' : s.intent === 'Commercial' ? '#f59e0b' : s.intent === 'Local' ? '#f8fafc' : '#3b82f6', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1.5px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '4px 10px',
                            borderRadius: '6px'
                          }}>{s.intent}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MASTER CONTENT SECTION */}
          <section style={{ marginTop: '80px', display: 'flex', flexDirection: 'column', gap: '50px' }}>
            <div style={{ background: 'rgba(15,23,42,0.4)', padding: '60px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '25px', letterSpacing: '-2px' }}>The Ultimate Guide to <span style={{ color: 'var(--accent)' }}>Localized Keyword Research</span></h2>
              <p style={{ color: '#94a3b8', fontSize: '17px', lineHeight: '1.8', marginBottom: '20px' }}>
                In today's digital landscape, generic keyword research is no longer enough to stay competitive. Search engines have evolved to prioritize localization, meaning a user in <strong>Gurgaon</strong> will see vastly different suggestions and results than a user in <strong>Melbourne</strong>.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '17px', lineHeight: '1.8' }}>
                Our <strong>Keyword Explorer Pro</strong> is designed to bridge this gap. By utilizing advanced <strong>UULE (Uniform User Locality Encoding)</strong>, we simulate real-world searches from any specific coordinate on the planet. This allows businesses, SEO professionals, and content creators to tap into high-intent search queries that are hyper-relevant to their local audience.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
               <div style={{ background: 'rgba(15,23,42,0.4)', padding: '50px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '20px' }}>Mastering UULE Precision</h3>
                  <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.8', marginBottom: '15px' }}>
                    UULE is a base64 encoded parameter used by Google to identify the exact location of a user. Standard tools often provide "national" data, which completely misses the local "near me" or "in [city]" variations.
                  </p>
                  <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.8' }}>
                    When you enter a city, our system generates the unique UULE key for that location. This "teleports" our crawler to that area, revealing the exact autocomplete suggestions that local customers see.
                  </p>
               </div>
               <div style={{ background: 'rgba(15,23,42,0.4)', padding: '50px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '20px' }}>Categorizing Search Intent</h3>
                  <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.8', marginBottom: '15px' }}>
                    Not all keywords are created equal. A user searching for "how to fix a tap" is in a different stage of the buying cycle than someone searching for "best plumber price".
                  </p>
                  <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.8' }}>
                    Our AI-driven intent mapper automatically labels every discovered keyword. This allows you to prioritize <strong>Transactional</strong> and <strong>Commercial</strong> terms for your landing pages.
                  </p>
               </div>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.4)', padding: '60px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '25px' }}>Why <span style={{ color: 'var(--accent)' }}>Deep Discovery</span> Matters</h2>
              <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.9' }}>
                Standard keyword tools only scrape the top-level suggestions. Our Alphabet Soup Expansion goes 40 levels deep. We take your seed keyword and append every letter of the alphabet, plus common SEO modifiers like "best", "near", "price", and "how". This recursive search uncovers <strong>Long-Tail Keywords</strong> - low competition, high-conversion phrases that your competitors aren't even aware of.
              </p>
            </div>
          </section>

          {/* FAQ SECTION (SIDEBAR LAYOUT AT THE BOTTOM) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', marginTop: '80px' }}>
            
            {/* LEFT: FAQ BOX */}
            <div style={{ background: 'rgba(15,23,42,0.4)', padding: '50px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '40px' }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700' }}>{faq.q}</span>
                      <span style={{ fontSize: '20px', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: '0.3s' }}>+</span>
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '0 30px 30px', color: '#64748b', fontSize: '15px', lineHeight: '1.8' }}>{faq.a}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: PRO SIDEBAR BOX */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
               <div style={{ background: 'rgba(59,130,246,0.05)', padding: '40px', borderRadius: '40px', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '15px', color: '#3b82f6' }}>Pro Tip: Use UULE</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>Generic tools give generic data. Our UULE encoder allows you to "teleport" to any city to find exactly what local customers are typing.</p>
               </div>
               <div style={{ background: 'rgba(15,23,42,0.6)', padding: '40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '15px' }}>System Status</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {[
                       { label: 'Alphabet Soup', status: 'Active' },
                       { label: 'UULE Engine', status: 'Live' },
                     ].map((node, n) => (
                       <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>{node.label}</span>
                          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '900' }}>{node.status}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
      
      <style>{`
        .loader-small { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default KeywordExplorer;
