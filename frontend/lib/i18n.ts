export type Locale = 'ru' | 'en' | 'kk';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'ҚАЗ' },
];

const dict = {
  ru: {
    nav: {
      jobs: 'Вакансии',
      careerPaths: 'Карьерные пути',
      interview: 'Собеседования',
      portfolio: 'Портфолио',
      guide: 'Гайд по стажировкам',
      companies: 'Компании',
      schools: 'Школы',
      login: 'Войти',
      logout: 'Выйти',
    },
    home: {
      heroTitle: 'IT возможности\nЦентральной Азии',
      heroSubtitle: 'Найди стажировку, вакансию или курс в лучших IT-компаниях Казахстана, Кыргызстана и Узбекистана',
      sectionStacks: 'Популярные технологии',
      sectionCompanies: 'Компании региона',
      sectionCompaniesSub: 'IT-компании Казахстана, Кыргызстана и Узбекистана — стажировки и вакансии',
      sectionSchools: 'Школы и курсы',
      sectionSchoolsSub: 'Курсы и буткемпы для входа в IT — с сертификатами и трудоустройством',
      sectionOpportunities: 'Актуальные возможности',
      sectionOpportunitiesSub: 'Стажировки и вакансии с быстрым откликом',
      careerBannerTitle: 'Построй карьерный путь',
      careerBannerSub: 'Пошаговые треки от Junior до Senior',
      interviewBannerTitle: 'Подготовься к собеседованию',
      interviewBannerSub: 'Реальные вопросы с ответами',
      emptyCo: 'Компании скоро появятся',
      emptyCoSub: 'Пока данных нет — попробуй изменить фильтры или посмотри карьерные пути',
      emptySch: 'Школы скоро появятся',
      emptySchSub: 'Пока нет школ по выбранному фильтру. Попробуй сбросить фильтры.',
      footer: 'Сделано для роста IT-комьюнити Центральной Азии.',
    },
    company: {
      internships: 'Стажировки',
      vacancies: 'Вакансии',
      apply: 'Подать заявку',
      respond: 'Откликнуться',
      level: 'Уровень',
      details: 'Подробнее',
      website: 'Сайт',
      telegram: 'Telegram',
      email: 'Email',
      contacts: 'Контакты',
      techStack: 'Технологии',
      noOpportunities: 'Нет открытых позиций',
      backToList: '← Все компании',
    },
    school: {
      courses: 'Курсы',
      goToSite: 'Перейти на сайт →',
      details: 'Подробнее',
      noCourses: 'Нет курсов',
      backToList: '← Все школы',
    },
    interview: {
      title: 'Вопросы с собеседований',
      subtitle: 'Подготовься к интервью с реальными вопросами от компаний',
      allLevels: 'Все уровни',
      allTopics: 'Все темы',
      allSpecialties: 'Все специальности',
      levelEasy: 'Легкий',
      levelMedium: 'Средний',
      levelHard: 'Сложный',
      answer: 'Ответ',
      explanation: 'Пояснение',
      timesAsked: 'Спрашивали',
      times: 'раз',
      successRate: 'Успех',
      loading: 'Загружаем вопросы...',
      empty: 'Нет вопросов для выбранных фильтров',
    },
    common: {
      loading: 'Загружаем...',
      back: 'Назад',
      notFound: 'Не найдено',
      internship: 'Стажировка',
      vacancy: 'Вакансия',
    },
  },

  en: {
    nav: {
      jobs: 'Jobs',
      careerPaths: 'Career Paths',
      interview: 'Interviews',
      portfolio: 'Portfolio',
      guide: 'Internship Guide',
      companies: 'Companies',
      schools: 'Schools',
      login: 'Log in',
      logout: 'Log out',
    },
    home: {
      heroTitle: 'IT Opportunities\nin Central Asia',
      heroSubtitle: 'Find internships, jobs, or courses at top IT companies in Kazakhstan, Kyrgyzstan and Uzbekistan',
      sectionStacks: 'Popular Technologies',
      sectionCompanies: 'Regional Companies',
      sectionCompaniesSub: 'IT companies from Kazakhstan, Kyrgyzstan and Uzbekistan — internships and vacancies',
      sectionSchools: 'Schools & Courses',
      sectionSchoolsSub: 'Bootcamps and courses to break into IT — with certificates and job placement',
      sectionOpportunities: 'Open Opportunities',
      sectionOpportunitiesSub: 'Internships and vacancies with quick apply',
      careerBannerTitle: 'Build Your Career Path',
      careerBannerSub: 'Step-by-step tracks from Junior to Senior',
      interviewBannerTitle: 'Prepare for Interviews',
      interviewBannerSub: 'Real questions with answers',
      emptyCo: 'Companies coming soon',
      emptyCoSub: 'No data yet — try changing filters or explore career paths',
      emptySch: 'Schools coming soon',
      emptySchSub: 'No schools match your filter. Try resetting filters.',
      footer: 'Built for the IT community of Central Asia.',
    },
    company: {
      internships: 'Internships',
      vacancies: 'Vacancies',
      apply: 'Apply',
      respond: 'Apply now',
      level: 'Level',
      details: 'View details',
      website: 'Website',
      telegram: 'Telegram',
      email: 'Email',
      contacts: 'Contacts',
      techStack: 'Tech Stack',
      noOpportunities: 'No open positions',
      backToList: '← All companies',
    },
    school: {
      courses: 'Courses',
      goToSite: 'Go to website →',
      details: 'View details',
      noCourses: 'No courses',
      backToList: '← All schools',
    },
    interview: {
      title: 'Interview Questions',
      subtitle: 'Prepare for interviews with real questions from companies',
      allLevels: 'All levels',
      allTopics: 'All topics',
      allSpecialties: 'All specialties',
      levelEasy: 'Easy',
      levelMedium: 'Medium',
      levelHard: 'Hard',
      answer: 'Answer',
      explanation: 'Explanation',
      timesAsked: 'Asked',
      times: 'times',
      successRate: 'Success',
      loading: 'Loading questions...',
      empty: 'No questions for selected filters',
    },
    common: {
      loading: 'Loading...',
      back: 'Back',
      notFound: 'Not found',
      internship: 'Internship',
      vacancy: 'Vacancy',
    },
  },

  kk: {
    nav: {
      jobs: 'Бос орындар',
      careerPaths: 'Мансап жолдары',
      interview: 'Сұхбат',
      portfolio: 'Портфолио',
      guide: 'Тәжірибе нұсқаулығы',
      companies: 'Компаниялар',
      schools: 'Мектептер',
      login: 'Кіру',
      logout: 'Шығу',
    },
    home: {
      heroTitle: 'Орталық Азиядағы\nIT мүмкіндіктер',
      heroSubtitle: 'Қазақстан, Қырғызстан және Өзбекстандағы үздік IT-компанияларда тәжірибе, жұмыс немесе курс тап',
      sectionStacks: 'Танымал технологиялар',
      sectionCompanies: 'Өңір компаниялары',
      sectionCompaniesSub: 'Қазақстан, Қырғызстан және Өзбекстанның IT-компаниялары — тәжірибелер мен бос орындар',
      sectionSchools: 'Мектептер мен курстар',
      sectionSchoolsSub: 'IT-ға кіру үшін курстар мен буткемптер — сертификаттар және жұмысқа орналасу',
      sectionOpportunities: 'Өзекті мүмкіндіктер',
      sectionOpportunitiesSub: 'Жылдам өтінім беруге болатын тәжірибелер мен бос орындар',
      careerBannerTitle: 'Мансап жолын құр',
      careerBannerSub: 'Junior-дан Senior-ға дейін қадамдық трек',
      interviewBannerTitle: 'Сұхбатқа дайындал',
      interviewBannerSub: 'Жауаптары бар нақты сұрақтар',
      emptyCo: 'Компаниялар жақында қосылады',
      emptyCoSub: 'Әзірге деректер жоқ — сүзгілерді өзгертіп көр немесе мансап жолдарын қара',
      emptySch: 'Мектептер жақында қосылады',
      emptySchSub: 'Таңдалған сүзгі бойынша мектептер жоқ. Сүзгілерді тазалап көр.',
      footer: 'Орталық Азиядағы IT-қоғамдастық үшін жасалған.',
    },
    company: {
      internships: 'Тәжірибелер',
      vacancies: 'Бос орындар',
      apply: 'Өтінім беру',
      respond: 'Жауап беру',
      level: 'Деңгей',
      details: 'Толығырақ',
      website: 'Сайт',
      telegram: 'Telegram',
      email: 'Email',
      contacts: 'Байланыс',
      techStack: 'Технологиялар',
      noOpportunities: 'Ашық позициялар жоқ',
      backToList: '← Барлық компаниялар',
    },
    school: {
      courses: 'Курстар',
      goToSite: 'Сайтқа өту →',
      details: 'Толығырақ',
      noCourses: 'Курстар жоқ',
      backToList: '← Барлық мектептер',
    },
    interview: {
      title: 'Сұхбат сұрақтары',
      subtitle: 'Компаниялардың нақты сұрақтарымен сұхбатқа дайындал',
      allLevels: 'Барлық деңгейлер',
      allTopics: 'Барлық тақырыптар',
      allSpecialties: 'Барлық мамандықтар',
      levelEasy: 'Жеңіл',
      levelMedium: 'Орташа',
      levelHard: 'Күрделі',
      answer: 'Жауап',
      explanation: 'Түсіндірме',
      timesAsked: 'Сұралды',
      times: 'рет',
      successRate: 'Сәттілік',
      loading: 'Сұрақтар жүктелуде...',
      empty: 'Таңдалған сүзгілер бойынша сұрақтар жоқ',
    },
    common: {
      loading: 'Жүктелуде...',
      back: 'Артқа',
      notFound: 'Табылмады',
      internship: 'Тәжірибе',
      vacancy: 'Бос орын',
    },
  },
} as const;

export interface Translations {
  nav: {
    jobs: string; careerPaths: string; interview: string; portfolio: string;
    guide: string; companies: string; schools: string; login: string; logout: string;
  };
  home: {
    heroTitle: string; heroSubtitle: string;
    sectionStacks: string; sectionCompanies: string; sectionCompaniesSub: string;
    sectionSchools: string; sectionSchoolsSub: string;
    sectionOpportunities: string; sectionOpportunitiesSub: string;
    careerBannerTitle: string; careerBannerSub: string;
    interviewBannerTitle: string; interviewBannerSub: string;
    emptyCo: string; emptyCoSub: string; emptySch: string; emptySchSub: string;
    footer: string;
  };
  company: {
    internships: string; vacancies: string; apply: string; respond: string;
    level: string; details: string; website: string; telegram: string;
    email: string; contacts: string; techStack: string; noOpportunities: string;
    backToList: string;
  };
  school: {
    courses: string; goToSite: string; details: string; noCourses: string; backToList: string;
  };
  interview: {
    title: string; subtitle: string; allLevels: string; allTopics: string; allSpecialties: string;
    levelEasy: string; levelMedium: string; levelHard: string;
    answer: string; explanation: string; timesAsked: string; times: string;
    successRate: string; loading: string; empty: string;
  };
  common: {
    loading: string; back: string; notFound: string; internship: string; vacancy: string;
  };
}

export const translations: Record<Locale, Translations> = dict;
