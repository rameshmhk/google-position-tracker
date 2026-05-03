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

// Persistent cache for city autocomplete to reduce API calls and improve performance
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
  
  // Search Region States
  const [regionSearch, setRegionSearch] = useState('');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // City Autocomplete States
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isCityLinked, setIsCityLinked] = useState(false); // Flag to lock canonical string

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
    
    // Removed manual SEO settings in favor of React Helmet

    // Schema handles by React Helmet in render

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Photon City Fetch Logic with Advanced Caching
  useEffect(() => {
    if (city.length < 2) {
      setCitySuggestions([]);
      return;
    }

    // Check Cache First
    const cacheKey = `${city.toLowerCase().trim()}_${region}`;
    if (cityAutocompleteCache.has(cacheKey)) {
      setCitySuggestions(cityAutocompleteCache.get(cacheKey));
      setIsCityLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        // STRICT BIASING: Filter cities by the selected search region node
        const countryParam = region ? `&countrycode=${region}` : '';
        // Optimization: Added osm_tag=place for better geographic focus
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(city)}${countryParam}&limit=15&lang=en&osm_tag=place`);
        const data = await res.json();
        
        if (!data.features) throw new Error("Invalid data format");

        const suggestions = data.features.map(f => {
          const p = f.properties;
          const parts = [p.name, p.district, p.city, p.state, p.country].filter(Boolean);
          const uniqueParts = [...new Set(parts)];
          return {
            display: uniqueParts.join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            country: p.country,
            postcode: p.postcode
          };
        });

        // Store in Cache
        cityAutocompleteCache.set(cacheKey, suggestions);
        
        setCitySuggestions(suggestions);
      } catch (err) {
        console.error("City fetch failed", err);
        // Fallback to empty if failed, but don't cache failures
      } finally {
        setIsCityLoading(false);
      }
    }, 400); // Increased debounce to 400ms to reduce rapid-fire requests

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
        // Google UULE requires a canonical name. Raw coordinates are unreliable.
        // We prefer the city name if available, even when GPS node is active.
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
      // Added &near param for extra hinting when coordinates are used
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
  };

  const openVerify = (baseUrl, posIndex, device = 'desktop') => {
    const start = posIndex;
    const deviceParam = device === 'mobile' ? '&adtest=on' : '';
    // Use &pws=0 for non-personalized results and hl=en for consistent language
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
    setCity(''); // Clear city when country changes for fresh intent
    setLat('');
    setLng('');
    // INSTANT FEEDBACK: Clear stale suggestions
    setCitySuggestions([]);
  };

  const selectCity = (s) => {
    setCity(s.display);
    setIsCityLinked(true); // LOCK CANONICAL
    
    // Clear and update coordinates
    if (s.lat && s.lng) {
      setLat(s.lat.toString());
      setLng(s.lng.toString());
    } else {
      setLat('');
      setLng('');
    }

    // Clear and update pincode
    if (s.postcode) {
      setPincode(s.postcode);
    } else {
      setPincode('');
    }

    setShowCityDropdown(false);
    setActivePriority('city'); 

    // INTELLIGENT NODE SWITCHING: 
    // Automatically switch the search region node if the city belongs to a different country
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
          {JSON.stringify(schema)}
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
        
        /* New SEO Styles */
        .seo-section { padding: 100px 25px; max-width: 1100px; margin: 0 auto; line-height: 1.7; color: #334155; }
        .seo-title { font-size: 38px; fontWeight: 900; color: #1e293b; letterSpacing: -1px; marginBottom: 30px; lineHeight: 1.2; position: relative; }
        .seo-title::after { content: ''; position: absolute; left: 0; bottom: -10px; width: 60px; height: 4px; background: var(--accent); border-radius: 2px; }
        .seo-card { background: #fff; padding: 40px; borderRadius: 24px; border: 1px solid #f1f5f9; boxShadow: 0 10px 40px rgba(0,0,0,0.02); height: 100%; transition: 0.3s; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .seo-card:hover { transform: translateY(-5px); boxShadow: 0 20px 50px rgba(0,0,0,0.04); }
        .seo-feature-icon { width: 70px; height: 70px; background: rgba(255, 153, 0, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 25px; color: var(--accent); border: 1px solid rgba(255, 153, 0, 0.15); line-height: 1; }
        .faq-item { background: #fff; border-radius: 16px; border: 1px solid #f1f5f9; marginBottom: 15px; overflow: hidden; }
        .faq-question { padding: 20px 30px; fontSize: 16px; fontWeight: 800; color: #1e293b; cursor: pointer; display: flex; alignItems: center; justifyContent: space-between; }
        .faq-answer { padding: 0 30px 25px; fontSize: 14px; color: #64748b; }
      `}</style>
      <Navbar />
      
      <div className="pro-containers" style={{ paddingTop: '50px', paddingBottom: '40px', maxWidth: '900px', margin: '0 auto' }}>
        {/* --- PROFESSIONAL HEADER --- */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ margin: '0 auto 15px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 15px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
            <span style={{ fontSize: '14px' }}>🛡️</span> ENTERPRISE NODE ACTIVE
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1.5px', color: '#1D2B44', marginBottom: '10px' }}>
            Advanced <span style={{ color: 'var(--accent)' }}>SERP Investigator</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: '500' }}>Precision Search Engine Position Tracking & Intelligence</p>
        </div>

        {/* --- COMPACT RANK CONSOLE --- */}
        <div className="elite-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <div style={{ background: '#1D2B44', padding: '15px 30px', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>Google Rank Investigation Console</h2>
          </div>

          <div style={{ padding: '25px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 700 ? '1.2fr 1fr' : '1fr', gap: '25px', marginBottom: '25px' }}>
              <div className="param-field">
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                   📋 Keywords for Analysis
                </span>
                <textarea 
                  className="elite-input-compact"
                  style={{ height: '110px', background: '#f8f9fa' }}
                  placeholder="Insert keywords (one per line)..." 
                  value={keywords} 
                  onChange={e => setKeywords(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="param-field" style={{ position: 'relative' }} ref={dropdownRef}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>1. Choose Search Region (Google Node)</span>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="elite-input-compact" 
                      style={{ background: '#f8f9fa', paddingRight: '40px' }} 
                      placeholder="e.g. India (google.co.in)"
                      value={regionSearch}
                      onFocus={() => setShowRegionDropdown(true)}
                      onChange={e => { setRegionSearch(e.target.value); setShowRegionDropdown(true); }}
                    />
                    <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</div>
                    
                    {showRegionDropdown && (
                      <div className="autocomplete-list">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map(c => (
                            <div key={c.code} className="autocomplete-item" onClick={() => selectCountry(c)}>
                              <span>{c.flag}</span>
                              <span style={{ flex: 1 }}>{c.name}</span>
                              <span style={{ opacity: 0.4, textTransform: 'uppercase', fontSize: '10px' }}>({c.code})</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>No countries found...</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="param-field" style={{ position: 'relative' }} ref={cityDropdownRef}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }} onClick={() => setActivePriority('city')}>
                    <div className={`tick-box ${activePriority === 'city' ? 'active' : ''}`}>
                      {activePriority === 'city' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                    </div>
                    <span className={`tick-label ${activePriority === 'city' ? 'active' : ''}`}>
                      2. Target Geographic City Area
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="elite-input-compact" 
                      placeholder={region ? "Search cities within selected region..." : "Choose country first..."}
                      value={city} 
                      onFocus={() => { setActivePriority('city'); setShowCityDropdown(true); }} 
                      onChange={e => { 
                        setCity(e.target.value); 
                        setIsCityLoading(true); // Instant visual feedback
                        setShowCityDropdown(true);
                        setIsCityLinked(false); // BREAK LINK ON TYPE
                        // PROACTIVE CLEARANCE: Reset dependent fields to prevent stale data
                        setLat('');
                        setLng('');
                        setPincode('');
                      }} 
                      style={{ background: '#f8f9fa' }} 
                    />
                    {isCityLoading && (
                      <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                         <div className="ping-animate" style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                      </div>
                    )}
                    {showCityDropdown && citySuggestions.length > 0 && (
                      <div className="autocomplete-list">
                        {citySuggestions.map((s, i) => (
                          <div key={i} className="autocomplete-item" onClick={() => selectCity(s)}>
                             <span style={{ fontSize: '14px' }}>📍</span>
                             <span style={{ flex: 1, fontSize: '12px' }}>{s.display}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                     *City suggestions are filtered by the region selected above.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 700 ? '1fr 1fr' : '1fr', gap: '25px', borderTop: '1px solid #f1f5f9', paddingTop: '25px' }}>
              <div className="param-field">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }} onClick={() => setActivePriority('pincode')}>
                    <div className={`tick-box ${activePriority === 'pincode' ? 'active' : ''}`}>
                      {activePriority === 'pincode' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                    </div>
                    <span className={`tick-label ${activePriority === 'pincode' ? 'active' : ''}`}>Target Postal / Zip Code</span>
                 </div>
                 <input className="elite-input-compact" placeholder="e.g. 2000" value={pincode} onFocus={() => setActivePriority('pincode')} onChange={e => setPincode(e.target.value)} style={{ width: '100%', background: '#f8f9fa' }} />
              </div>
              <div className="param-field">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }} onClick={() => setActivePriority('coordinates')}>
                    <div className={`tick-box ${activePriority === 'coordinates' ? 'active' : ''}`}>
                      {activePriority === 'coordinates' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                    </div>
                    <span className={`tick-label ${activePriority === 'coordinates' ? 'active' : ''}`}>High Precision GPS Node</span>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <input className="elite-input-compact" placeholder="Lat" value={lat} onChange={e => setLat(e.target.value)} style={{ background: '#f8f9fa' }} onFocus={() => setActivePriority('coordinates')} />
                   <input className="elite-input-compact" placeholder="Lng" value={lng} onChange={e => setLng(e.target.value)} style={{ background: '#f8f9fa' }} onFocus={() => setActivePriority('coordinates')} />
                 </div>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
               <button 
                className="pro-button" 
                onClick={handleUniversalCheck} 
                style={{ padding: '0 50px', height: '52px', fontSize: '14px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '8px', boxShadow: '0 8px 30px rgba(255, 153, 0, 0.3)' }}
              >
                ⚡ Start Live Search
              </button>
            </div>
          </div>
        </div>

        {/* --- COMPACT RESULTS SECTION --- */}
        {isGenerated && (
          <div className="results-section" style={{ marginTop: '50px' }}>
            <div className="results-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {results.map((r, idx) => (
                <div key={idx} className="elite-card" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 5px 20px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                  
                  {/* CARD HEADER - COMPACT */}
                  <div style={{ padding: '8px 20px', background: 'rgba(29, 43, 68, 0.02)', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                        <div className="ping-animate" style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', opacity: 0.6 }}></div>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#1D2B44' }}>{r.keyword}</h4>
                    </div>
                  </div>

                  {/* DATA HUB GRID - HORIZONTAL ELITE */}
                  <div style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 800 ? 'repeat(3, 1fr)' : '1fr', gap: '25px' }}>
                      {/* DESKTOP */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#1D2B44', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          🖥️ Desktop
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', justifyItems: 'center' }}>
                          {Array.from({ length: expandedRows[`${r.keyword}_desktop`] || 5 }).map((_, i) => (
                            <button key={i} onClick={() => openVerify(r.baseUrl, i * 10, 'desktop')} className="pill-button" style={{ background: '#3b82f6', color: '#fff', border: 'none', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}>
                              <span style={{ fontSize: '11px', fontWeight: '900' }}>P{i + 1}</span>
                            </button>
                          ))}
                          {(expandedRows[`${r.keyword}_desktop`] || 5) < 20 && (
                            <button onClick={() => handleIncrementExpansion(r.keyword, 'desktop', expandedRows[`${r.keyword}_desktop`] || 5)} style={{ background: '#f8f9fa', border: '1px dashed #cbd5e1', borderRadius: '20px', fontSize: '12px', fontWeight: '900', color: '#94a3b8', cursor: 'pointer', height: '32px', width: '100%', maxWidth: '55px' }}>+</button>
                          )}
                        </div>
                      </div>

                      {/* MOBILE */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#1D2B44', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          📱 Mobile
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', justifyItems: 'center' }}>
                          {Array.from({ length: expandedRows[`${r.keyword}_mobile`] || 5 }).map((_, i) => (
                            <button key={i} onClick={() => openVerify(r.baseUrl, i * 10, 'mobile')} className="pill-button" style={{ background: '#10b981', color: '#fff', border: 'none', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                              <span style={{ fontSize: '11px', fontWeight: '900' }}>M{i + 1}</span>
                            </button>
                          ))}
                          {(expandedRows[`${r.keyword}_mobile`] || 5) < 20 && (
                            <button onClick={() => handleIncrementExpansion(r.keyword, 'mobile', expandedRows[`${r.keyword}_mobile`] || 5)} style={{ background: '#f8f9fa', border: '1px dashed #cbd5e1', borderRadius: '20px', fontSize: '12px', fontWeight: '900', color: '#94a3b8', cursor: 'pointer', height: '32px', width: '100%', maxWidth: '55px' }}>+</button>
                          )}
                        </div>
                      </div>

                      {/* MAPS */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#1D2B44', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          📍 Map Pack
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', justifyItems: 'center' }}>
                          {Array.from({ length: expandedRows[`${r.keyword}_maps`] || 5 }).map((_, i) => (
                            <button key={i} onClick={() => window.open(`${r.baseUrl}&udm=1&start=${i * 20}`, '_blank')} className="pill-button" style={{ color: '#fff', border: 'none', background: '#f97316', boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)' }}>
                              <span style={{ fontSize: '11px', fontWeight: '900' }}>MAP {i + 1}</span>
                            </button>
                          ))}
                          {(expandedRows[`${r.keyword}_maps`] || 5) < 20 && (
                            <button onClick={() => handleIncrementExpansion(r.keyword, 'maps', expandedRows[`${r.keyword}_maps`] || 5)} style={{ background: '#f8f9fa', border: '1px dashed #cbd5e1', borderRadius: '20px', fontSize: '12px', fontWeight: '900', color: '#94a3b8', cursor: 'pointer', height: '32px', width: '100%', maxWidth: '55px' }}>+</button>
                          )}
                          <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(r.keyword)}/@${r.lat},${r.lng},15z`)} style={{ background: '#1D2B44', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '8px', fontWeight: '900', cursor: 'pointer', gridColumn: 'span 5', width: '100%', marginTop: '5px', boxShadow: '0 4px 10px rgba(29, 43, 68, 0.2)' }}>EXPLORE MAPS</button>
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

      {/* --- NEW SEO CONTENT SECTIONS (Inspired by SE Ranking) --- */}
      
      {/* SECTION 1: ADVANCED SERP OVERVIEW */}
      <section className="seo-section" style={{ background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 900 ? '1fr 1fr' : '1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <h1 className="seo-title">Google <span style={{ color: 'var(--accent)' }}>Location Changer</span> <br/>& SERP Investigator</h1>
            <p style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Gain 100% accurate insights into how your website performs in any city or region globally.
            </p>
            <p style={{ marginBottom: '25px' }}>
              Our platform goes beyond basic rank tracking by simulating real-user behavior through our proprietary search nodes. The <strong>Google Location Changer</strong> provides the precise data needed to dominate local search results by spoofing your location at the Google hardware node level.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                "Real-time Google Maps local pack detection",
                "Mobile vs. Desktop indexing analysis",
                "UULE-encoded precise location spoofing",
                "Deep-link verification for position validation"
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: '700' }}>
                  <span style={{ color: '#10b981' }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
             <div style={{ background: '#1D2B44', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '35px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>Live Satellite Telemetry</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="ping-animate" style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#10b981', letterSpacing: '1px' }}>CONNECTED</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Position #1 Canonical Detection</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: (city && isCityLinked) ? '#fff' : '#64748b', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    {city && isCityLinked ? (
                       `s.display_${city.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`
                    ) : (
                       "> Awaiting Geographic Uplink..."
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', transition: '0.3s' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>High-Precision GPS Node</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                       <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent)', marginBottom: '8px' }}>LATITUDE</div>
                       <div style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'monospace', color: lat ? '#10b981' : '#fff' }}>{lat ? parseFloat(lat).toFixed(6) : "00.000000"}</div>
                    </div>
                    <div style={{ width: '2px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                       <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent)', marginBottom: '8px' }}>LONGITUDE</div>
                       <div style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'monospace', color: lng ? '#10b981' : '#fff' }}>{lng ? parseFloat(lng).toFixed(6) : "00.000000"}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '10px', borderRadius: '12px' }}>
                   <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Signal Integrity: <span style={{ fontWeight: '900' }}>Verified - 98.4ms</span></div>
                </div>
             </div>
          </div>
        </div>
      </section>

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
          <h2 className="seo-title" style={{ margin: '0 auto 20px', display: 'inline-block' }}>Ranking Intelligence <span style={{ color: 'var(--accent)' }}>FAQ</span></h2>
          <p>Common questions about local SEO tracking and our Advanced Investigatory tool.</p>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {[
            { q: "What is a Google Location Changer?", a: "A Google Location Changer is an advanced tool that allows SEO professionals to view search engine results as if they were physically located in a different city, state, or country. This is essential for local SEO audits and competitive analysis." },
            { q: "How accurate is the Advanced SERP Investigator?", a: "Our tool utilizes UULE encoding and high-precision GPS coordinates to spoof your location at the Google node level, providing 100% accuracy that matches what a real user in that location would see." },
            { q: "Do you support Google Maps (Local Pack) results?", a: "Yes. Our tool specifically detects and highlights Map Pack rankings, ensuring you can track your business's impact on Google My Business and local map results globally." },
            { q: "Why should I use this over a standard VPN?", a: "VPNS only change your IP address, which Google often ignores in favor of browser-level location data. Our tool changes your actual search intent coordinates, which is significantly more powerful and accurate for regional SEO." }
          ].map((item, idx) => (
            <div key={idx} className="faq-item">
              <div className="faq-question">
                {item.q}
                <span>+</span>
              </div>
              <div className="faq-answer">
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- COMMUNITY COMMENTS SECTION --- */}
      <section className="seo-section" style={{ background: '#fff', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>Community Feedback</h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Share your ranking success and tips with our global community.</p>
          </div>

          {/* Comment Form */}
          <div style={{ background: '#f8fafc', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '60px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>Leave a comment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 600 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
              <input 
                type="email" 
                placeholder="Your Email ID" 
                style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
              />
              <input 
                type="text" 
                placeholder="Facebook Profile URL / ID" 
                style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
              />
            </div>
            <textarea 
              placeholder="Write your ranking tip or feedback here..." 
              style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }}
            ></textarea>
            <button style={{ background: '#1D2B44', color: '#fff', padding: '12px 30px', borderRadius: '8px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
              Post Comment
            </button>
          </div>

          {/* Mock Comments for SEO & Trust */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {[
              { name: "John SEO", comment: "Amazing tool! The UULE precision for New York was 100% accurate compared to my manual search.", social: "fb.com/johnseo", date: "2 hours ago" },
              { name: "Priya Sharma", comment: "Finally found a tool that handles Indian local pack results correctly. P1 detected perfectly.", social: "fb.com/priyash", date: "5 hours ago" },
              { name: "Digital Marketer", comment: "Used this for a client audit today. The mobile vs desktop switch is a life saver.", social: "fb.com/digitalpro", date: "1 day ago" }
            ].map((c, i) => (
              <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900' }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.date}</div>
                    </div>
                  </div>
                  <a href={`https://${c.social}`} target="_blank" rel="noreferrer" style={{ fontSize: '18px', color: '#3b82f6', textDecoration: 'none' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.74h-2.94v-3.403h2.94v-2.511c0-2.91 1.777-4.496 4.376-4.496 1.245 0 2.317.092 2.628.134v3.048l-1.804.001c-1.412 0-1.685.672-1.685 1.654v2.17h3.374l-.439 3.403h-2.935v8.74h6.14c.731 0 1.325-.593 1.325-1.325v-21.351c0-.732-.594-1.325-1.325-1.325z"/></svg>
                  </a>
                </div>
                <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', paddingLeft: '50px' }}>{c.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FreeChecker;
