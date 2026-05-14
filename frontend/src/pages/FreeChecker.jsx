import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../index.css';

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
  { code: 'nz', name: 'New Zealand', flag: '🇳🇿', tld: 'google.co.nz', aliases: ['NZ'] },
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
  { code: 'za', name: 'South Africa', flag: '🇿🇦', tld: 'google.co.za', aliases: ['SA'] },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷', tld: 'google.co.kr' },
  { code: 'es', name: 'Spain', flag: '🇪🇸', tld: 'google.es' },
  { code: 'lk', name: 'Sri Lanka', flag: '🇱🇰', tld: 'google.lk' },
  { code: 'sr', name: 'Suriname', flag: '🇸🇷', tld: 'google.sr' },
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
  { code: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', tld: 'google.ae', aliases: ['UAE'] },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', tld: 'google.co.uk', aliases: ['UK', 'GB'] },
  { code: 'us', name: 'United States', flag: '🇺🇸', tld: 'google.com', aliases: ['USA'] },
  { code: 'uy', name: 'Uruguay', flag: '🇺🇾', tld: 'google.com.uy' },
  { code: 'uz', name: 'Uzbekistan', flag: '🇺🇿', tld: 'google.co.uz' },
  { code: 'vu', name: 'Vanuatu', flag: '🇻🇺', tld: 'google.vu' },
  { code: 've', name: 'Venezuela', flag: '🇻🇪', tld: 'google.co.ve' },
  { code: 'vn', name: 'Vietnam', flag: '🇻🇳', tld: 'google.com.vn' },
  { code: 'zm', name: 'Zambia', flag: '🇿🇲', tld: 'google.co.zm' },
  { code: 'zw', name: 'Zimbabwe', flag: '🇿🇼', tld: 'google.co.zw' }
];

const cityAutocompleteCache = new Map();

const FreeChecker = () => {
  const [keywords, setKeywords] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('au');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [pincode, setPincode] = useState('');
  const [results, setResults] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [activePriority, setActivePriority] = useState('city');
  const [expandedRows, setExpandedRows] = useState({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const [regionSearch, setRegionSearch] = useState('');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isCityLinked, setIsCityLinked] = useState(false);
  const resultsRef = useRef(null);

  // --- COMMUNITY COMMENT STATES ---
  const [comments, setComments] = useState([
    { name: "John SEO", comment: "The UULE precision here is unmatched.", socials: { fb: "https://facebook.com/rankinganywhere", ig: "https://instagram.com/rankinganywhere", li: "https://linkedin.com/company/rankinganywhere" }, date: "2 hours ago" },
    { name: "Sarah Miller", comment: "Dashboard is super clean.", socials: { fb: "https://facebook.com/rankinganywhere", li: "https://linkedin.com/company/rankinganywhere" }, date: "5 hours ago" },
    { name: "Digital Pulse", comment: "Testing the Direct Proxy node today.", socials: { ig: "https://instagram.com/rankinganywhere" }, date: "1 day ago" },
    { name: "Local SEO Pro", comment: "The GPS override feature is a game changer.", socials: { fb: "#" }, date: "2 days ago" },
    { name: "Market Guru", comment: "Accurate results even for very competitive niches.", socials: { li: "#" }, date: "2 days ago" },
    { name: "Site Auditor", comment: "Fast scans and reliable data.", socials: { ig: "#" }, date: "3 days ago" },
    { name: "Ranking Expert", comment: "I use this daily to check my main keywords.", socials: { fb: "#", li: "#" }, date: "3 days ago" },
    { name: "SEO Agency", comment: "Great for quick spot checks.", socials: { ig: "#" }, date: "4 days ago" },
    { name: "Web Master", comment: "Integration with maps is perfect.", socials: { fb: "#" }, date: "4 days ago" },
    { name: "Search Analyst", comment: "Very impressive UULE encoding logic.", socials: { li: "#" }, date: "5 days ago" },
    { name: "Community User", comment: "Joining the discussion! Great tool.", socials: { fb: "#", ig: "#" }, date: "62 days ago" }
  ]);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', fb: '', ig: '', li: '', text: '' });
  const [commentStatus, setCommentStatus] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);


  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentForm.name || !commentForm.text) {
      alert("Please fill in your name and comment.");
      return;
    }
    // Simulation: In reality, this would send to backend for moderation
    setCommentStatus('success');
    setTimeout(() => {
      setCommentStatus(null);
      setCommentForm({ name: '', email: '', fb: '', ig: '', li: '', text: '' });
    }, 3000);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRegionDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (city.length < 2) {
      setCitySuggestions([]);
      return;
    }
    const cacheKey = `${city.toLowerCase().trim()}_${region}`;
    if (cityAutocompleteCache.has(cacheKey)) {
      setCitySuggestions(cityAutocompleteCache.get(cacheKey));
      setIsCityLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        const countryParam = region ? `&country=${region}` : '';
        // Use relative path so it works on both localhost and production
        const apiUrl = window.location.hostname === 'localhost' 
          ? `http://localhost:5001/api/locations/search?q=${encodeURIComponent(city)}${countryParam}`
          : `/api/locations/search?q=${encodeURIComponent(city)}${countryParam}`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setCitySuggestions(data);
      } catch (err) {
        console.error("City fetch failed", err);
      } finally {
        setIsCityLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [city, region]);

  const handleUniversalCheck = () => {
    const keyArray = keywords.split('\n').filter(k => k.trim()).slice(0, 10);
    if (keyArray.length === 0) {
      alert("❌ Please enter at least one keyword.");
      return;
    }
    const selectedCountry = COUNTRY_DB.find(c => c.code === region) || COUNTRY_DB[0];
    const newResults = keyArray.map(k => {
      const countryName = selectedCountry.name;
      let canonical = '';
      if (activePriority === 'coordinates' && lat && lng) {
        canonical = city ? city : `${lat}, ${lng}, ${countryName}`;
      } else if (activePriority === 'pincode' && pincode) {
        canonical = `${pincode}, ${countryName}`;
      } else {
        canonical = city ? city : countryName;
      }
      const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      const key = UULE_CHARS[canonical.length] || 'A';
      const uuleEncoded = btoa(unescape(encodeURIComponent(canonical))).replace(/=/g, '');
      const uule = `&uule=w+CAIQICI${key}${uuleEncoded}`;
      const tld = selectedCountry.tld || 'google.com';
      const query = encodeURIComponent(k.trim());
      const nearParam = (activePriority === 'coordinates' && lat && lng) ? `&near=${encodeURIComponent(city || countryName)}` : '';
      const baseSearchUrl = `https://www.${tld}/search?q=${query}${uule}${nearParam}&gl=${region}`;
      return {
        keyword: k.trim(),
        baseUrl: baseSearchUrl,
        lat: lat.trim(),
        lng: lng.trim(),
        priorityUsed: activePriority
      };
    });
    setResults(newResults);
    setIsGenerated(true);
    
    // Smooth scroll to results
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const openVerify = (baseUrl, posIndex, device = 'desktop') => {
    const start = posIndex;
    const deviceParam = device === 'mobile' ? '&adtest=on' : '';
    const finalUrl = `${baseUrl}&start=${start}${deviceParam}&pws=0&hl=en`;
    window.open(finalUrl, '_blank');
  };

  const getMatchScore = (c, search) => {
    const s = search.toLowerCase();
    if (!s) return 0;
    const name = c.name.toLowerCase();
    const code = c.code.toLowerCase();
    const aliases = (c.aliases || []).map(a => a.toLowerCase());
    if (code === s) return 5;
    if (aliases.includes(s)) return 4;
    if (name.startsWith(s)) return 3;
    if (code.startsWith(s)) return 2;
    if (name.includes(s)) return 1;
    return 0;
  };

  const filteredCountries = COUNTRY_DB
    .map(c => ({ ...c, score: getMatchScore(c, regionSearch) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const selectCountry = (c) => {
    setRegion(c.code);
    setRegionSearch(c.name);
    setShowRegionDropdown(false);
    setCity('');
    setLat('');
    setLng('');
    setCitySuggestions([]);
  };

  const selectCity = (s) => {
    setCity(s.display);
    setIsCityLinked(true);
    if (s.lat && s.lng) {
      setLat(s.lat.toString());
      setLng(s.lng.toString());
    } else {
      setLat('');
      setLng('');
    }
    if (s.postcode) {
      setPincode(s.postcode);
    } else {
      setPincode('');
    }
    setShowCityDropdown(false);
    setActivePriority('city'); 
    const cityParts = s.display.split(',').map(p => p.trim());
    const countryName = cityParts[cityParts.length - 1];
    if (countryName) {
      const matchingCountry = COUNTRY_DB.find(c => 
        c.name.toLowerCase() === countryName.toLowerCase() || 
        (c.aliases && c.aliases.some(a => a.toLowerCase() === countryName.toLowerCase()))
      );
      if (matchingCountry && matchingCountry.code !== region) {
        setRegion(matchingCountry.code);
        setRegionSearch(matchingCountry.name);
      }
    }
  };

  const handleIncrementExpansion = (keyword, category, currentCount) => {
    const nextStep = Math.min(currentCount + 5, 20);
    setExpandedRows({...expandedRows, [`${keyword}_${category}`]: nextStep});
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Google Location Changer",
    "url": "https://www.ranktrackerpro.com/free-check",
    "description": "Free advanced SERP investigator and Google Location Changer. View search results from any city or ZIP code globally.",
    "applicationCategory": "SEO Tool",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <div className="landing-page" style={{ minHeight: '100vh', background: 'var(--bg-main)', color: '#1D2B44' }}>
      <Helmet>
        <title>Google Location Changer | Free Advanced SERP Investigator</title>
        <meta name="description" content="The ultimate Google Location Changer tool. Change your search location to any city or ZIP code globally with 100% precision. Free advanced SERP investigator for SEO professionals." />
        <meta name="keywords" content="google location changer, change google search location, local seo checker, serp investigator" />
        <script type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Google Location Changer",
              "url": "https://rankinganywhere.com/free-check",
              "description": "Free advanced SERP investigator and Google Location Changer. View search results from any city or ZIP code globally.",
              "applicationCategory": "SEO Tool",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Ranking Anywhere",
              "url": "https://rankinganywhere.com/"
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Ranking Anywhere",
              "url": "https://rankinganywhere.com/",
              "logo": "https://rankinganywhere.com/logo.png"
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://rankinganywhere.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Live Rank Tracker",
                  "item": "https://rankinganywhere.com/free-check"
                }
              ]
            }
          ])}
        </script>
      </Helmet>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .ping-animate { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .elite-input-compact { padding: 12px 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; transition: 0.2s; outline: none; width: 100%; box-sizing: border-box; }
        .elite-input-compact:focus { border-color: var(--accent); }
        .tick-box { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: 0.2s; cursor: pointer; }
        .tick-box.active { background: #10b981; border-color: #10b981; }
        .tick-label { font-size: 10px; font-weight: 900; color: #1D2B44; text-transform: uppercase; cursor: pointer; user-select: none; }
        .tick-label.active { color: #10b981; }
        .autocomplete-list { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 5px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; max-height: 250px; overflow-y: auto; }
        .autocomplete-item { padding: 10px 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f8f9fa; }
        .autocomplete-item:hover { background: #f8f9fa; color: var(--accent); }
        .autocomplete-item:last-child { border-bottom: none; }
        .pill-button { background: #fff; border: 1px solid #e1e7ef; padding: 6px 12px; borderRadius: 20px; fontSize: 10px; fontWeight: 900; cursor: pointer; transition: 0.2s; minWidth: 45px; textAlign: center; display: flex; flexDirection: column; gap: 2px; flex: 1; minWidth: 55px; box-sizing: border-box; }
        .pill-button:hover { border-color: var(--accent); color: var(--accent); background: rgba(255,153,0,0.05); }
        /* Desktop Effect: Glass Shine */
        @keyframes shine-sweep {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        .desktop-shiny {
          position: relative;
          overflow: hidden;
          background: #3b82f6 !important;
          color: #fff !important;
          border: none !important;
        }
        .desktop-shiny::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -100%;
          width: 60%;
          height: 200%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          transform: rotate(30deg);
          animation: shine-sweep 3s infinite;
        }

        /* Mobile Effect: Ripple Ping */
        @keyframes ripple-ping {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .mobile-ping {
          animation: ripple-ping 2s infinite;
          background: #10b981 !important;
          color: #fff !important;
          border: none !important;
        }

        /* Map Pack Effect: Floating Marker */
        @keyframes marker-float {
          0% { transform: translateY(0); filter: brightness(1); }
          50% { transform: translateY(-4px); filter: brightness(1.2); }
          100% { transform: translateY(0); filter: brightness(1); }
        }
        .map-marker {
          animation: marker-float 2s infinite ease-in-out;
          background: #f97316 !important;
          color: #fff !important;
          border: none !important;
        }

        .pill-button:hover { transform: scale(1.1); filter: contrast(1.2); z-index: 10; }
        .seo-section { padding: 100px 25px; max-width: 1100px; margin: 0 auto; line-height: 1.7; color: #334155; }
        .seo-title { font-size: 38px; fontWeight: 900; color: #1e293b; letterSpacing: -1px; marginBottom: 30px; lineHeight: 1.2; position: relative; }
        .seo-title::after { content: ''; position: absolute; left: 0; bottom: -10px; width: 60px; height: 4px; background: var(--accent); border-radius: 2px; }
        .faq-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 15px; overflow: hidden; transition: 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .faq-item:hover { border-color: var(--accent); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .faq-question { padding: 20px 25px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #1e293b; font-size: 16px; transition: 0.2s; }
        .faq-question:hover { color: var(--accent); }
        .faq-answer { padding: 0 25px; max-height: 0; overflow: hidden; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); color: #64748b; font-size: 14px; line-height: 1.8; opacity: 0; }
        .faq-item.active .faq-answer { padding-bottom: 25px; max-height: 200px; opacity: 1; }
        .faq-item.active .faq-question { color: var(--accent); }
        .faq-icon { width: 32px; height: 32px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: 0.3s; color: #94a3b8; }
        .faq-item.active .faq-icon { transform: rotate(45deg); background: var(--accent); color: #fff; }
      `}</style>
      <Navbar />
      
      <div className="pro-containers" style={{ paddingTop: '50px', paddingBottom: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ margin: '0 auto 15px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 15px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
            <span style={{ fontSize: '14px' }}>🛡️</span> ENTERPRISE NODE ACTIVE
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1.5px', color: '#1D2B44', marginBottom: '10px' }}>
            Advanced <span style={{ color: 'var(--accent)' }}>SERP Investigator</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: '500' }}>Precision Search Engine Position Tracking & Intelligence</p>
        </div>

        <div className="elite-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <div style={{ background: '#1D2B44', padding: '15px 30px', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>Google Rank Investigation Console</h2>
          </div>
          <div style={{ padding: '25px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 700 ? '1.2fr 1fr' : '1fr', gap: '25px', marginBottom: '25px' }}>
              <div className="param-field">
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>📋 Keywords for Analysis</span>
                <textarea className="elite-input-compact" style={{ height: '110px', background: '#f8f9fa' }} placeholder="Insert keywords (one per line)..." value={keywords} onChange={e => setKeywords(e.target.value)}></textarea>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="param-field" style={{ position: 'relative' }} ref={dropdownRef}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>1. Choose Search Region</span>
                  <div style={{ position: 'relative' }}>
                    <input className="elite-input-compact" style={{ background: '#f8f9fa', paddingRight: '40px' }} placeholder="e.g. India" value={regionSearch} onFocus={() => setShowRegionDropdown(true)} onChange={e => { setRegionSearch(e.target.value); setShowRegionDropdown(true); }} />
                    <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</div>
                    {showRegionDropdown && (
                      <div className="autocomplete-list">
                        {filteredCountries.map(c => (
                          <div key={c.code} className="autocomplete-item" onClick={() => selectCountry(c)}>
                            <span>{c.flag}</span><span style={{ flex: 1 }}>{c.name}</span><span style={{ opacity: 0.4, fontSize: '10px' }}>({c.code})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="param-field" style={{ position: 'relative' }} ref={cityDropdownRef}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }} onClick={() => setActivePriority('city')}>
                    <div className={`tick-box ${activePriority === 'city' ? 'active' : ''}`}>{activePriority === 'city' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}</div>
                    <span className={`tick-label ${activePriority === 'city' ? 'active' : ''}`}>2. Target City Area</span>
                  </div>
                  <input className="elite-input-compact" placeholder="Search cities..." value={city} onFocus={() => { setActivePriority('city'); setShowCityDropdown(true); }} onChange={e => { setCity(e.target.value); setIsCityLoading(true); setShowCityDropdown(true); setIsCityLinked(false); }} style={{ background: '#f8f9fa' }} />
                  {isCityLoading && <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}><div className="ping-animate" style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div></div>}
                  {showCityDropdown && citySuggestions.length > 0 && (
                    <div className="autocomplete-list">
                      {citySuggestions.map((s, i) => (
                        <div key={i} className="autocomplete-item" onClick={() => selectCity(s)}>📍 <span style={{ flex: 1, fontSize: '12px' }}>{s.display}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 700 ? '1fr 1fr' : '1fr', gap: '25px', borderTop: '1px solid #f1f5f9', paddingTop: '25px' }}>
              <div className="param-field">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }} onClick={() => setActivePriority('pincode')}>
                    <div className={`tick-box ${activePriority === 'pincode' ? 'active' : ''}`}>{activePriority === 'pincode' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}</div>
                    <span className={`tick-label ${activePriority === 'pincode' ? 'active' : ''}`}>Target Pincode</span>
                 </div>
                 <input className="elite-input-compact" placeholder="e.g. 2000" value={pincode} onFocus={() => setActivePriority('pincode')} onChange={e => setPincode(e.target.value)} style={{ background: '#f8f9fa' }} />
              </div>
              <div className="param-field">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }} onClick={() => setActivePriority('coordinates')}>
                    <div className={`tick-box ${activePriority === 'coordinates' ? 'active' : ''}`}>{activePriority === 'coordinates' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}</div>
                    <span className={`tick-label ${activePriority === 'coordinates' ? 'active' : ''}`}>GPS Node</span>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <input className="elite-input-compact" placeholder="Lat" value={lat} onChange={e => setLat(e.target.value)} onFocus={() => setActivePriority('coordinates')} style={{ background: '#f8f9fa' }} />
                   <input className="elite-input-compact" placeholder="Lng" value={lng} onChange={e => setLng(e.target.value)} onFocus={() => setActivePriority('coordinates')} style={{ background: '#f8f9fa' }} />
                 </div>
              </div>
            </div>
            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
               <button className="pro-button" onClick={handleUniversalCheck} style={{ padding: '0 50px', height: '52px', borderRadius: '8px' }}>⚡ Start Live Search</button>
            </div>
          </div>
        </div>

        {isGenerated && (
          <div className="results-section" style={{ marginTop: '50px' }} ref={resultsRef}>
            <div className="results-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {results.map((r, idx) => (
                <div key={idx} className="elite-card" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 20px', background: 'rgba(29, 43, 68, 0.02)', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>{r.keyword}</h4>
                  </div>
                  <div style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 800 ? 'repeat(3, 1fr)' : '1fr', gap: '25px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', marginBottom: '10px' }}>🖥️ Desktop</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                          {Array.from({ length: expandedRows[`${r.keyword}_desktop`] || 5 }).map((_, i) => (
                             <button key={i} onClick={() => openVerify(r.baseUrl, i * 10, 'desktop')} className="pill-button desktop-shiny">P{i + 1}</button>
                          ))}
                          {(expandedRows[`${r.keyword}_desktop`] || 5) < 20 && (
                            <button onClick={() => handleIncrementExpansion(r.keyword, 'desktop', expandedRows[`${r.keyword}_desktop`] || 5)} className="pill-button" style={{ border: '1px dashed #3b82f6', color: '#3b82f6', background: 'transparent', fontWeight: 'bold', fontSize: '14px' }}>+</button>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', marginBottom: '10px' }}>📱 Mobile</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                          {Array.from({ length: expandedRows[`${r.keyword}_mobile`] || 5 }).map((_, i) => (
                             <button key={i} onClick={() => openVerify(r.baseUrl, i * 10, 'mobile')} className="pill-button mobile-ping">M{i + 1}</button>
                          ))}
                          {(expandedRows[`${r.keyword}_mobile`] || 5) < 20 && (
                            <button onClick={() => handleIncrementExpansion(r.keyword, 'mobile', expandedRows[`${r.keyword}_mobile`] || 5)} className="pill-button" style={{ border: '1px dashed #10b981', color: '#10b981', background: 'transparent', fontWeight: 'bold', fontSize: '14px' }}>+</button>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', marginBottom: '10px' }}>📍 Map Pack</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                          {Array.from({ length: expandedRows[`${r.keyword}_maps`] || 5 }).map((_, i) => (
                             <button key={i} onClick={() => window.open(`${r.baseUrl}&udm=1&start=${i * 20}`, '_blank')} className="pill-button map-marker">MAP {i + 1}</button>
                          ))}
                          {(expandedRows[`${r.keyword}_maps`] || 5) < 20 && (
                            <button onClick={() => handleIncrementExpansion(r.keyword, 'maps', expandedRows[`${r.keyword}_maps`] || 5)} className="pill-button" style={{ border: '1px dashed #f97316', color: '#f97316', background: 'transparent', fontWeight: 'bold', fontSize: '14px' }}>+</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* SECTION 2: GLOBAL STRATEGY & NODES */}
      <section className="seo-section" style={{ background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', marginBottom: '70px' }}>
          <h2 className="seo-title" style={{ margin: '0 auto 20px', display: 'inline-block' }}>Global Rank Strategy & <span style={{ color: 'var(--accent)' }}>Search Nodes</span></h2>
          <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '16px' }}>
            We utilize a sophisticated network of geographically distributed search nodes to ensure your ranking data is never filtered or localized incorrectly.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 800 ? 'repeat(3, 1fr)' : '1fr', gap: '30px' }}>
          {[
            { icon: '🌐', title: 'Global Node Network', desc: 'Securely verify rankings across 200+ countries and 10,000+ local cities with dedicated node clusters.' },
            { icon: '📱', title: 'Mobile-First Indexing', desc: 'Simulate high-end mobile devices to see your search presence as it appears on the latest iOS and Android units.' },
            { icon: '🛡️', title: 'CORS-Secure Logic', desc: 'Our infrastructure bypasses regional blocks and browser limitations to provide direct, unfiltered SERP access.' }
          ].map((feature, idx) => (
            <div key={idx} className="seo-card">
              <div className="seo-feature-icon">{feature.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '15px' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: CORE LOCATION INTELLIGENCE */}
      <section className="seo-section" style={{ background: '#fff' }}>
        <div style={{ background: '#1D2B44', padding: '80px', borderRadius: '40px', color: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 900 ? '1fr 1.2fr' : '1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '20px' }}>Enterprise SEO Architecture</div>
              <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '25px', lineHeight: '1.1' }}>Professional Local SEO <br/>Intelligence Command</h2>
              <p style={{ marginBottom: '30px', opacity: 0.8 }}>
                The Advanced Investigator is just the start. Manage tens of thousands of keywords, automate daily scans, and generate professional reports through our unified SEO command center.
              </p>
              <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '15px 35px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,153,0,0.3)' }}>
                 Deploy Fully Managed Node
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
               {[
                 { label: 'Instant', value: '250ms', sub: 'Average Response' },
                 { label: 'Accuracy', value: '100%', sub: 'Verified Data' },
                 { label: 'Uptime', value: '99.9%', sub: 'Node Stability' },
                 { label: 'Global', value: '1M+', sub: 'Geo Locations' }
               ].map((stat, idx) => (
                 <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5, marginBottom: '5px' }}>{stat.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)' }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>{stat.sub}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ HUB */}
      <section className="seo-section" style={{ background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Knowledge Base</div>
          <h2 className="seo-title" style={{ margin: '0 auto 20px', display: 'inline-block' }}>Ranking Intelligence <span style={{ color: 'var(--accent)' }}>FAQ Hub</span></h2>
          <p style={{ color: '#64748b' }}>Common questions about local SEO tracking and our Advanced Investigatory tool.</p>
        </div>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          {[
            { q: "What is a Google Location Changer?", a: "A Google Location Changer is an advanced tool that allows SEO professionals to view search engine results as if they were physically located in a different city, state, or country. This is essential for local SEO audits and competitive analysis." },
            { q: "How accurate is the Advanced SERP Investigator?", a: "Our tool utilizes UULE encoding and high-precision GPS coordinates to spoof your location at the Google node level, providing 100% accuracy that matches what a real user in that location would see." },
            { q: "Do you support Google Maps (Local Pack) results?", a: "Yes. Our tool specifically detects and highlights Map Pack rankings, ensuring you can track your business's impact on Google My Business and local map results globally." },
            { q: "Why should I use this over a standard VPN?", a: "VPNs only change your IP address, which Google often ignores in favor of browser-level location data. Our tool changes your actual search intent coordinates, which is significantly more powerful and accurate for regional SEO." },
            { q: "Is the UULE parameter required for every check?", a: "While not 'required' for basic searches, the UULE parameter is the gold standard for location-based searching. It guarantees that Google treats the request as coming from that specific latitude and longitude." }
          ].map((item, idx) => (
            <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`} onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
              <div className="faq-question">
                <span>{item.q}</span>
                <div className="faq-icon">+</div>
              </div>
              <div className="faq-answer">
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW SECTION: PRO TIPS */}
      <section className="seo-section" style={{ background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 800 ? '1fr 1fr' : '1fr', gap: '50px', alignItems: 'center' }}>
          <div style={{ order: windowWidth > 800 ? 1 : 2 }}>
             <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" alt="SEO Analysis" style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
          </div>
          <div style={{ order: windowWidth > 800 ? 2 : 1 }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '25px' }}>Pro Tips for <span style={{ color: 'var(--accent)' }}>Local Dominance</span></h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { title: 'Use Precise ZIP Codes', desc: 'Instead of just city names, use exact ZIP/Postcodes for hyper-local Map Pack tracking.' },
                { title: 'Monitor Mobile Variations', desc: 'Google shows different results for mobile users. Always check both desktop and mobile nodes.' },
                { title: 'Leverage UULE Parameters', desc: 'Our tool automatically generates the correct UULE string so you don\'t have to worry about complex encoding.' },
                { title: 'Analyze Map Pack Proximity', desc: 'Check rankings from different corners of the same city to see how distance affects your business visibility.' }
              ].map((tip, i) => (
                <li key={i} style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                  <div style={{ width: '24px', height: '24px', background: 'rgba(255,153,0,0.1)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>{i+1}</div>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '16px', marginBottom: '5px' }}>{tip.title}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{tip.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="seo-section" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Community Feedback</h2>
            <p style={{ color: '#64748b' }}>Share your ranking success with our global community.</p>
          </div>

          
          <div style={{ background: '#f8fafc', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '60px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Join the Discussion</h3>
            
            {commentStatus === 'success' ? (
              <div style={{ background: '#10b981', color: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center', fontWeight: '900' }}>
                ✓ Thank you! Your review has been submitted for moderation.
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 600 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    value={commentForm.name}
                    onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                    style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={commentForm.email}
                    onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                    style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 600 ? '1fr 1fr 1fr' : '1fr', gap: '15px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="Facebook URL" 
                    value={commentForm.fb}
                    onChange={(e) => setCommentForm({...commentForm, fb: e.target.value})}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} 
                  />
                  <input 
                    type="text" 
                    placeholder="Instagram URL" 
                    value={commentForm.ig}
                    onChange={(e) => setCommentForm({...commentForm, ig: e.target.value})}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} 
                  />
                  <input 
                    type="text" 
                    placeholder="LinkedIn URL" 
                    value={commentForm.li}
                    onChange={(e) => setCommentForm({...commentForm, li: e.target.value})}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} 
                  />
                </div>

                <textarea 
                  placeholder="Your feedback..." 
                  value={commentForm.text}
                  onChange={(e) => setCommentForm({...commentForm, text: e.target.value})}
                  style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }}
                ></textarea>
                
                <button 
                  type="submit"
                  style={{ background: '#1D2B44', color: '#fff', padding: '12px 35px', borderRadius: '8px', fontWeight: '900', border: 'none', cursor: 'pointer' }}
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {comments.slice(0, 10).map((c, i) => (
              <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', background: '#1e293b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900' }}>{c.name[0]}</div>
                    <div><div style={{ fontWeight: '900', color: '#0f172a' }}>{c.name}</div><div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.date}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {c.socials.fb && <a href={c.socials.fb} target="_blank" rel="noreferrer" style={{ color: '#1877F2' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>}
                    {c.socials.ig && <a href={c.socials.ig} target="_blank" rel="noreferrer" style={{ color: '#E4405F' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.811.247 2.23.408.556.215.957.47 1.372.884.414.414.67.815.884 1.372.162.42.355 1.061.408 2.23.058 1.265.069 1.645.069 4.849s-.011 3.584-.069 4.849c-.054 1.17-.247 1.812-.408 2.23-.215.557-.47.958-.884 1.372-.414.414-.815.67-1.372.884-.42.162-1.061.355-2.23.408-1.265.058-1.645.07-4.849.07s-3.584-.011-4.849-.07c-1.17-.054-1.812-.247-2.23-.408-.557-.215-.958-.47-1.372-.884-.414-.414-.815-.67-1.372-.884-.42-.162-1.061-.355-2.23-.408-1.265-.058-1.645-.07-4.849-.07s-3.584.011-4.849.07c-1.17.054-1.812.247-2.23.408-.557.215-.958.47-1.372.884-.414.414-.815.67-1.372.884-.42-.162-1.061-.355-2.23-.408-1.265-.058-1.645-.07-4.849-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.741 0 12s.012 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.303 1.636.504 2.913.56 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.56.788-.306 1.459-.718 2.126-1.384s1.079-1.338 1.384-2.126c.303-.765.504-1.636.56-2.913.058-1.28.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.56-2.913-.306-.789-.718-1.459-1.384-2.126s-1.338-1.079-2.126-1.384c-.765-.303-1.636-.504-2.913-.56C15.667.012 15.259 0 12 0zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>}
                    {c.socials.li && <a href={c.socials.li} target="_blank" rel="noreferrer" style={{ color: '#0077B5' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.2225 0z"/></svg></a>}
                  </div>
                </div>
                <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.8', paddingLeft: '60px' }}>{c.comment}</p>
              </div>
            ))}
          </div>

          {/* View More Button - Only shows if more than 10 comments */}
          {comments.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
               <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '12px 30px', borderRadius: '100px', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}>
                  View More Discussions ({comments.length}+)
               </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FreeChecker;
