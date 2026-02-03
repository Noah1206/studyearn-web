/**
 * Bank Configurations
 * 은행별 딥링크 설정 정보
 */

import { BankCode, BankInfo } from './types';

/**
 * 은행 정보 데이터베이스
 * 딥링크 지원 은행은 deeplinkScheme과 deeplinkTemplate이 정의됨
 */
export const BANKS: Record<BankCode, BankInfo> = {
  // 딥링크 완벽 지원 (토스, 카카오뱅크)
  toss: {
    code: 'toss',
    name: '토스',
    shortName: '토스',
    color: '#0064FF',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Toss-logo.svg',
    deeplinkScheme: 'supertoss',
    supportsDeeplink: true,
    deeplinkTemplate: 'supertoss://send?bank={bankCode}&accountNo={accountNumber}&amount={amount}&origin=studyearn',
    appStoreUrl: 'https://apps.apple.com/kr/app/id839333328',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=viva.republica.toss',
  },
  kakaobank: {
    code: 'kakaobank',
    name: '카카오뱅크',
    shortName: '카뱅',
    color: '#FFEB00',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/KakaoBank_logo.svg',
    deeplinkScheme: 'kakaobank',
    supportsDeeplink: true,
    deeplinkTemplate: 'kakaobank://link/transfer?bank={bankCode}&accountNo={accountNumber}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id1258016944',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.kakaobank.channel',
  },

  // 은행 앱 딥링크 지원 (제한적)
  kbstar: {
    code: 'kbstar',
    name: 'KB국민은행',
    shortName: 'KB',
    color: '#5B4B1F',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/KB_logo.svg',
    deeplinkScheme: 'kbbank',
    supportsDeeplink: true,
    deeplinkTemplate: 'kbbank://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id373742138',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.kbstar.kbbank',
  },
  shinhan: {
    code: 'shinhan',
    name: '신한은행',
    shortName: '신한',
    color: '#0046FF',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Shinhan_Bank_Logo_(ENG).svg',
    deeplinkScheme: 'shinhan-sr-ansimclick',
    supportsDeeplink: true,
    deeplinkTemplate: 'shinhan-sr-ansimclick://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id357484932',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.shinhan.sbanking',
  },
  woori: {
    code: 'woori',
    name: '우리은행',
    shortName: '우리',
    color: '#005BAC',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_of_Woori_Bank.svg',
    deeplinkScheme: 'wooribank',
    supportsDeeplink: true,
    deeplinkTemplate: 'wooribank://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id574426882',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wooribank.smart.npib',
  },
  hana: {
    code: 'hana',
    name: '하나은행',
    shortName: '하나',
    color: '#009490',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hana_Bank_Logo_(eng).svg',
    deeplinkScheme: 'hanabank',
    supportsDeeplink: true,
    deeplinkTemplate: 'hanabank://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id466896696',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hanabank.ebk.channel.android.hananbank',
  },
  nh: {
    code: 'nh',
    name: 'NH농협은행',
    shortName: '농협',
    color: '#009632',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nonghyup_financial_logo.svg',
    deeplinkScheme: 'nhsmartbanking',
    supportsDeeplink: true,
    deeplinkTemplate: 'nhsmartbanking://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id395571881',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=nh.smart.banking',
  },
  ibk: {
    code: 'ibk',
    name: 'IBK기업은행',
    shortName: 'IBK',
    color: '#0058A3',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Industrial_Bank_of_Korea_Logo.svg',
    deeplinkScheme: 'ibksmb',
    supportsDeeplink: true,
    deeplinkTemplate: 'ibksmb://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id373742138',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ibk.android.ionebank',
  },

  // 딥링크 미지원 은행
  sc: {
    code: 'sc',
    name: 'SC제일은행',
    shortName: 'SC',
    color: '#0076A8',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Standard_Chartered_(2021).svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  citi: {
    code: 'citi',
    name: '씨티은행',
    shortName: '씨티',
    color: '#003B70',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Citi.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  kbank: {
    code: 'kbank',
    name: '케이뱅크',
    shortName: '케뱅',
    color: '#FFD028',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kbank_logo.svg',
    deeplinkScheme: 'kbankapp',
    supportsDeeplink: true,
    deeplinkTemplate: 'kbankapp://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id1178872626',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.kbankwith.smartbank',
  },
  post: {
    code: 'post',
    name: '우체국',
    shortName: '우체국',
    color: '#EE2E24',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Korea_Post_Wordmark.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  saemaul: {
    code: 'saemaul',
    name: '새마을금고',
    shortName: '새마을',
    color: '#00A651',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mg_logo.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  shinhyup: {
    code: 'shinhyup',
    name: '신협',
    shortName: '신협',
    color: '#0070BA',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%EC%8B%A0%ED%98%91_%EB%A1%9C%EA%B3%A0.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  suhyup: {
    code: 'suhyup',
    name: '수협',
    shortName: '수협',
    color: '#0066B3',
    iconUrl: 'https://img.logodad.com/upload/c/Qru/Suhyup.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },

  // 지방은행
  busan: {
    code: 'busan',
    name: '부산은행',
    shortName: '부산',
    color: '#0066B3',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/BNK_Financial_Group_logo_01.png',
    deeplinkScheme: 'busanbank',
    supportsDeeplink: true,
    deeplinkTemplate: 'busanbank://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id390563822',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.busanbank.mbs',
  },
  dgb: {
    code: 'dgb',
    name: 'DGB대구은행',
    shortName: '대구',
    color: '#0074BA',
    iconUrl: 'https://img.logodad.com/upload/p/BCL/imbank.svg',
    deeplinkScheme: 'dgbsmb',
    supportsDeeplink: true,
    deeplinkTemplate: 'dgbsmb://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id390564020',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.dgb.android',
  },
  kwangju: {
    code: 'kwangju',
    name: '광주은행',
    shortName: '광주',
    color: '#00529B',
    iconUrl: 'https://img.logodad.com/upload/3/QtD/Kwangju-Bank.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  jeju: {
    code: 'jeju',
    name: '제주은행',
    shortName: '제주',
    color: '#0058AB',
    iconUrl: 'https://img.logodad.com/upload/z/J8D/Jeju-Bank.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  jeonbuk: {
    code: 'jeonbuk',
    name: '전북은행',
    shortName: '전북',
    color: '#004FA3',
    iconUrl: 'https://img.logodad.com/upload/S/HLz/Jeonbuk-Bank.svg',
    deeplinkScheme: null,
    supportsDeeplink: false,
  },
  kyongnam: {
    code: 'kyongnam',
    name: '경남은행',
    shortName: '경남',
    color: '#00529B',
    iconUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/BNK_Financial_Group_logo_01.png',
    deeplinkScheme: 'knbsmb',
    supportsDeeplink: true,
    deeplinkTemplate: 'knbsmb://transfer?accountNo={accountNumber}&bankCode={bankCode}&amount={amount}',
    appStoreUrl: 'https://apps.apple.com/kr/app/id398456213',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.knb.psb',
  },
};

/**
 * 토스에서 사용하는 은행 코드 매핑
 * 토스 딥링크에서 사용하는 은행 코드
 */
export const TOSS_BANK_CODES: Record<BankCode, string> = {
  toss: '092',        // 토스뱅크
  kakaobank: '090',   // 카카오뱅크
  kbstar: '004',      // KB국민
  shinhan: '088',     // 신한
  woori: '020',       // 우리
  hana: '081',        // 하나
  nh: '011',          // 농협
  ibk: '003',         // 기업
  sc: '023',          // SC제일
  citi: '027',        // 씨티
  kbank: '089',       // 케이뱅크
  post: '071',        // 우체국
  saemaul: '045',     // 새마을금고
  shinhyup: '048',    // 신협
  suhyup: '007',      // 수협
  busan: '032',       // 부산은행
  dgb: '031',         // 대구은행
  kwangju: '034',     // 광주은행
  jeju: '035',        // 제주은행
  jeonbuk: '037',     // 전북은행
  kyongnam: '039',    // 경남은행
};

/**
 * 딥링크 지원 은행 목록 반환
 */
export function getDeeplinkSupportedBanks(): BankInfo[] {
  return Object.values(BANKS).filter(bank => bank.supportsDeeplink);
}

/**
 * 추천 은행 목록 (딥링크 잘 지원하는 순)
 */
export const RECOMMENDED_BANKS: BankCode[] = [
  'toss',
  'kakaobank',
  'kbstar',
  'shinhan',
  'woori',
  'hana',
  'nh',
  'kbank',
];

/**
 * 은행 코드로 은행 정보 조회
 */
export function getBankInfo(code: BankCode): BankInfo | undefined {
  return BANKS[code];
}

/**
 * 모든 은행 목록 반환 (UI 선택용)
 */
export function getAllBanks(): BankInfo[] {
  return Object.values(BANKS);
}
