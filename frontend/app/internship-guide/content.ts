import { Locale } from '../../lib/i18n';

export interface Specialty {
  icon: string;
  title: string;
  skills: string[];
  petProject: string;
  tip: string;
}

export interface Lifehack {
  emoji: string;
  title: string;
  text: string;
}

export interface Step {
  num: string;
  title: string;
  text: string;
}

export interface GuideContent {
  meta: { title: string; description: string };
  hero: { badge: string; title: string; subtitle: string };
  whatIs: {
    title: string;
    intro: string;
    types: { icon: string; title: string; desc: string }[];
  };
  formula: {
    title: string;
    subtitle: string;
    items: { icon: string; title: string; desc: string }[];
    note: string;
  };
  specialties: {
    title: string;
    subtitle: string;
    list: Specialty[];
  };
  steps: {
    title: string;
    list: Step[];
  };
  lifehacks: {
    title: string;
    list: Lifehack[];
  };
  network: {
    title: string;
    subtitle: string;
    blocks: { icon: string; title: string; desc: string; examples: string[] }[];
  };
  timeline: {
    title: string;
    subtitle: string;
    items: { month: string; label: string; desc: string }[];
  };
  cta: { title: string; subtitle: string; button: string };
}

const ru: GuideContent = {
  meta: {
    title: 'Как попасть на стажировку в IT — полный гайд',
    description: 'Пошаговый гайд для разработчиков, QA, продактов, аналитиков и DS: как найти стажировку в IT в Казахстане, Кыргызстане и Узбекистане.',
  },
  hero: {
    badge: '📖 Полный гайд',
    title: 'Как попасть\nна стажировку в IT',
    subtitle: 'Всё что нужно знать — для разработчиков, QA, продактов, аналитиков и data scientists. От нуля до первого оффера.',
  },
  whatIs: {
    title: 'Что такое стажировка и зачем она нужна',
    intro: 'Стажировка — это твоя первая настоящая работа в IT. Ты работаешь в реальной команде, решаешь реальные задачи и получаешь опыт, который невозможно заменить никаким курсом. Это мост между обучением и карьерой.',
    types: [
      { icon: '💰', title: 'Оплачиваемая', desc: 'Большинство крупных IT-компаний платят стажёрам. Уровень — от $200 до $800 в месяц в зависимости от компании и роли.' },
      { icon: '🎓', title: 'Учебная (неоплачиваемая)', desc: 'Встречается реже. Подходит если компания очень крутая и опыт перевешивает отсутствие зарплаты. Оцени честно.' },
      { icon: '🏠', title: 'Удалённая', desc: 'Всё больше компаний берут стажёров удалённо. Это открывает доступ к компаниям из других городов и стран.' },
      { icon: '🏢', title: 'Офисная', desc: 'Ценнее для новичков — живое общение с ментором, быстрее учишься и налаживаешь нетворк.' },
      { icon: '🚀', title: 'В стартапе', desc: 'Больше ответственности с первого дня. Можешь попробовать разные роли. Риск выше, но рост быстрее.' },
      { icon: '🏦', title: 'В корпорации', desc: 'Чёткие процессы, ментор, обучение. Банки, телекомы и крупные IT-компании Казахстана активно берут стажёров.' },
    ],
  },
  formula: {
    title: 'Формула успеха',
    subtitle: 'Это не секрет — 99% успешных стажёров прошли по этому пути',
    items: [
      { icon: '📚', title: 'Курс или самообучение', desc: 'YouTube, Stepik, Udemy, официальная документация. Важен не источник, а понимание основ и умение учиться самостоятельно. Не жди "идеального" курса — начни с любого.' },
      { icon: '🐾', title: 'Пет-проект', desc: 'Личный проект — твоё главное оружие на собеседовании. HR и тимлид смотрят не на сертификаты, а на то, что ты умеешь делать. Один рабочий пет-проект на GitHub стоит больше десяти сертификатов.' },
      { icon: '🔁', title: 'Повторяй и улучшай', desc: 'Дорабатывай проект, добавляй фичи, исправляй баги. Покажи, что можешь работать итерационно — именно так и работают команды.' },
    ],
    note: '💡 Совет: не жди момента когда "буду готов". Подавай заявки когда освоил 60% — остальное доучишь в процессе.',
  },
  specialties: {
    title: 'Советы по специальностям',
    subtitle: 'У каждой роли своя специфика подготовки',
    list: [
      {
        icon: '⚙️',
        title: 'Backend разработчик',
        skills: ['Один язык хорошо (Go, Python, Java, Node.js)', 'REST API, HTTP методы', 'SQL — базовые запросы', 'Git', 'Docker — базово'],
        petProject: 'REST API для простого приложения: задачник, погода, новости. Покрой тестами хотя бы базовую логику.',
        tip: 'Знание SQL и умение объяснить как работает HTTP — это минимум для любого Backend-стажёра.',
      },
      {
        icon: '🎨',
        title: 'Frontend разработчик',
        skills: ['HTML/CSS — уверенно', 'JavaScript (ES6+)', 'React или Vue — основы', 'Git', 'Адаптивная вёрстка'],
        petProject: 'Адаптивный сайт или простое SPA: погода, список задач, калькулятор. Задеплой на Vercel или Netlify.',
        tip: 'Умение сверстать макет из Figma — огромный плюс. Попроси дизайн-файл у кого-то и сверстай.',
      },
      {
        icon: '📱',
        title: 'Mobile разработчик',
        skills: ['Flutter (Dart) или React Native', 'Работа с API', 'Навигация, состояние', 'Git'],
        petProject: 'Простое мобильное приложение с несколькими экранами и вызовом внешнего API. Выложи на GitHub с README.',
        tip: 'Flutter сейчас в тренде в ЦА — много компаний ищут Flutter-стажёров. Это хороший вход.',
      },
      {
        icon: '🧪',
        title: 'QA Engineer',
        skills: ['Тест-кейсы и чек-листы', 'Postman — тестирование API', 'Основы SQL', 'Баг-репорты', 'Jira или аналог'],
        petProject: 'Напиши тест-план для реального сайта (например, Kaspi). Сделай баг-репорты на реальные баги. Покажи в портфолио.',
        tip: 'QA — один из самых доступных входов в IT. Компании берут QA-стажёров охотнее, чем разработчиков.',
      },
      {
        icon: '📊',
        title: 'Business Analyst / Product Manager',
        skills: ['Понимание продуктового цикла', 'User stories, BRD', 'Figma — базово', 'SQL — базово', 'Метрики: DAU, retention, funnel'],
        petProject: 'Сделай product case: возьми реальный продукт, опиши его проблемы, предложи улучшения с метриками. Оформи в Notion или PDF.',
        tip: 'Для PM важнее насмотренность и понимание продуктов, чем технические навыки. Читай кейсы, разбирай чужие продукты.',
      },
      {
        icon: '🤖',
        title: 'Data Scientist / ML / AI',
        skills: ['Python — уверенно', 'Pandas, NumPy', 'Sklearn — базовые модели', 'Jupyter Notebook', 'SQL'],
        petProject: 'Анализ датасета с Kaggle: EDA, визуализация, простая модель. Оформи как Notebook с выводами.',
        tip: 'Kaggle — твоя социальная сеть. Участвуй в соревнованиях, даже если занимаешь последнее место. Это реальный опыт.',
      },
      {
        icon: '🛠️',
        title: 'DevOps / SRE',
        skills: ['Linux — базовые команды', 'Docker, Docker Compose', 'Git, CI/CD (GitHub Actions)', 'Nginx — базово', 'Bash скрипты'],
        petProject: 'Задеплой пет-проект (любой): Docker + Nginx + GitHub Actions CI. Опиши в README как запустить.',
        tip: 'Умение задеплоить приложение с нуля на VPS — уже достаточно для стажировки в большинстве компаний ЦА.',
      },
    ],
  },
  steps: {
    title: 'Пошаговый план',
    list: [
      { num: '01', title: 'Выбери специальность', text: 'Не пытайся изучить всё. Выбери одно направление и иди вглубь. Лучше знать одно хорошо, чем пять поверхностно.' },
      { num: '02', title: 'Базовый стек за 2-3 месяца', text: 'Один язык, основные инструменты, понимание как устроены приложения. Не обязательно знать всё — важно понимать как думать.' },
      { num: '03', title: 'Сделай пет-проект', text: 'Один нормальный проект на GitHub с README, скриншотами и описанием. Это твоё портфолио и тема для разговора на собеседовании.' },
      { num: '04', title: 'Подготовь резюме', text: 'Одна страница. Пет-проекты с ссылками на GitHub/деплой. Никакой воды. Используй шаблон из Notion или CV.kz.' },
      { num: '05', title: 'Подавай заявки массово', text: 'Не жди идеального момента. Подавай в 10-20 мест одновременно. Отклики — это воронка: из 20 придёт 5 собеседований, из них 1-2 оффера.' },
      { num: '06', title: 'Готовься к интервью', text: 'Повтори основы, порепетируй рассказ о себе и пет-проекте. Вопросы с собеседований есть на Jarlyq — используй их.' },
      { num: '07', title: 'Не сдавайся', text: 'Первый отказ — норма. Второй — тоже. Средний путь до первой стажировки — 2-4 месяца активного поиска. Каждый отказ = обратная связь.' },
    ],
  },
  lifehacks: {
    title: 'Лайфхаки',
    list: [
      { emoji: '⚡', title: 'Не жди готовности', text: 'Подавай заявки когда знаешь 60% требований. "Доучишься по ходу" — это реальная фраза большинства стажёров.' },
      { emoji: '🌿', title: 'GitHub каждый день', text: 'Зелёные квадраты — сигнал активности. Коммить хотя бы что-то каждый день: правки, README, рефакторинг.' },
      { emoji: '🎯', title: 'Качество > количество', text: 'Один глубокий пет-проект лучше пяти поверхностных. Доведи один до рабочего состояния и задеплой.' },
      { emoji: '🔍', title: 'Смотри изнутри', text: 'Перед собеседованием изучи продукт компании как пользователь. Найди баги, придумай улучшения — это удивит интервьюера.' },
      { emoji: '📝', title: 'Персонализируй CV', text: 'Не отправляй одно резюме везде. Переставь акценты под вакансию. На это уходит 5 минут, но конверсия выше.' },
      { emoji: '💬', title: 'Проси фидбек', text: 'После отказа всегда спрашивай "что мне улучшить?". Большинство HR ответят, и ты получишь ценный сигнал.' },
      { emoji: '🤝', title: 'LinkedIn работает', text: 'Добавляй людей после митапов и конференций. Пиши HR напрямую — это нормально в IT. Многие стажировки закрываются без объявлений.' },
      { emoji: '🏆', title: 'Хакатоны = портфолио + нетворк', text: 'За 48 часов получаешь реальный проект в команде. Даже место в середине — это история для собеседования.' },
    ],
  },
  network: {
    title: 'Нетворкинг, хакатоны и митапы',
    subtitle: 'IT в ЦА — маленький мир. Все знают всех. Один знакомый может изменить твою карьеру.',
    blocks: [
      {
        icon: '🤝',
        title: 'Нетворкинг',
        desc: 'Знакомства в IT работают иначе чем в других сферах. Люди здесь открыты, готовы помочь и советуют своих знакомых на вакансии. Начни с онлайн-сообществ.',
        examples: ['Telegram-чаты: IT Community KZ, Flutter KZ, Python KZ', 'LinkedIn — добавляй после любого события', 'Discord-сообщества по стекам', 'Местные Slack-пространства компаний'],
      },
      {
        icon: '🏆',
        title: 'Хакатоны',
        desc: 'Хакатон за 24-48 часов даёт: реальный проект в команде, нетворк с разработчиками и менторами, запись в резюме, и иногда — оффер напрямую от организатора.',
        examples: ['Digital Bridge (Астана)', 'Hack.kz', 'Astana Hub Hackathon', 'AITU Hackathon', 'Humo Hackathon (Ташкент)'],
      },
      {
        icon: '🎤',
        title: 'Митапы и конференции',
        desc: 'Живые события — лучший способ познакомиться с практикующими разработчиками. Не бойся подходить и задавать вопросы — это ожидаемое поведение на IT-событиях.',
        examples: ['GDG Almaty / GDG Bishkek', 'ReactConf KZ', 'PyDay Central Asia', 'DevFest Kazakhstan', 'Местные митапы в Notion Calendar сообществ'],
      },
      {
        icon: '📖',
        title: 'Open Source',
        desc: 'Даже маленький PR в открытый проект — это строчка в резюме и реальный опыт работы в команде с code review. Начни с документации или исправления опечаток.',
        examples: ['GitHub Explore — найди проект по своему стеку', 'First Contributions — специально для новичков', 'Local KZ/KG/UZ open source проекты', 'Jarlyq — сам проект открыт 😉'],
      },
    ],
  },
  timeline: {
    title: 'Реалистичный таймлайн',
    subtitle: 'У всех по-разному, но вот средняя картина при активной работе',
    items: [
      { month: 'Месяц 1–2', label: 'Основы', desc: 'Изучаешь базовый стек, делаешь упражнения, смотришь туториалы. Выбрал направление, понял нравится ли.' },
      { month: 'Месяц 3–4', label: 'Пет-проект', desc: 'Строишь первый проект от идеи до деплоя. Много гуглишь, застреваешь, решаешь проблемы — это нормально.' },
      { month: 'Месяц 5', label: 'Подготовка', desc: 'Полируешь CV и GitHub. Начинаешь смотреть вакансии, изучаешь типичные вопросы с собеседований.' },
      { month: 'Месяц 6', label: 'Активный поиск', desc: 'Подаёшь заявки в 15-20 мест. Ходишь на собеседования. Получаешь отказы, учишься, улучшаешь.' },
      { month: 'Месяц 7–8', label: 'Первый оффер 🎉', desc: 'Среднее время до первой стажировки при таком подходе. Некоторые быстрее, некоторые дольше — не сравнивай себя с другими.' },
    ],
  },
  cta: {
    title: 'Готов искать стажировку?',
    subtitle: 'На Jarlyq собраны стажировки и вакансии от IT-компаний Казахстана, Кыргызстана и Узбекистана',
    button: 'Найти стажировку →',
  },
};

const en: GuideContent = {
  meta: {
    title: 'How to Get an IT Internship — Complete Guide',
    description: 'Step-by-step guide for developers, QA, PMs, analysts and data scientists on how to land an IT internship in Kazakhstan, Kyrgyzstan and Uzbekistan.',
  },
  hero: {
    badge: '📖 Complete Guide',
    title: 'How to Get\nan IT Internship',
    subtitle: 'Everything you need to know — for developers, QA, product managers, analysts and data scientists. From zero to your first offer.',
  },
  whatIs: {
    title: 'What is an Internship and Why You Need One',
    intro: 'An internship is your first real job in IT. You work in a real team, solve real problems, and gain experience that no course can replace. It\'s the bridge between learning and a career.',
    types: [
      { icon: '💰', title: 'Paid', desc: 'Most large IT companies pay interns. Rates range from $200–$800/month depending on company and role.' },
      { icon: '🎓', title: 'Unpaid / Academic', desc: 'Less common. Only worth it if the company is exceptional and the experience outweighs the lack of pay. Be honest with yourself.' },
      { icon: '🏠', title: 'Remote', desc: 'More companies are taking remote interns. This opens up opportunities with companies in other cities and countries.' },
      { icon: '🏢', title: 'On-site', desc: 'More valuable for beginners — face-to-face mentorship means you learn faster and build your network.' },
      { icon: '🚀', title: 'Startup', desc: 'More responsibility from day one. You get to try different roles. Higher risk, but faster growth.' },
      { icon: '🏦', title: 'Corporate', desc: 'Clear processes, dedicated mentor, structured learning. Banks, telecoms and large IT companies in Kazakhstan actively hire interns.' },
    ],
  },
  formula: {
    title: 'The Success Formula',
    subtitle: 'Not a secret — 99% of successful interns followed this path',
    items: [
      { icon: '📚', title: 'Course or Self-Study', desc: 'YouTube, Udemy, official docs. What matters isn\'t the source but understanding the fundamentals and learning how to learn. Don\'t wait for the "perfect" course — start with any.' },
      { icon: '🐾', title: 'Pet Project', desc: 'Your personal project is your main weapon in an interview. HR and tech leads look at what you can build, not certificates. One working pet project on GitHub is worth more than ten certificates.' },
      { icon: '🔁', title: 'Iterate and Improve', desc: 'Keep improving your project, add features, fix bugs. Show that you can work iteratively — that\'s exactly how real teams work.' },
    ],
    note: '💡 Tip: don\'t wait until you\'re "ready". Apply when you know 60% of the requirements — you\'ll learn the rest on the job.',
  },
  specialties: {
    title: 'Tips by Specialty',
    subtitle: 'Each role has its own preparation specifics',
    list: [
      {
        icon: '⚙️',
        title: 'Backend Developer',
        skills: ['One language well (Go, Python, Java, Node.js)', 'REST API, HTTP methods', 'SQL — basic queries', 'Git', 'Docker — basics'],
        petProject: 'REST API for a simple app: todo list, weather, news. Add basic test coverage.',
        tip: 'Knowing SQL and being able to explain how HTTP works is the minimum for any backend intern.',
      },
      {
        icon: '🎨',
        title: 'Frontend Developer',
        skills: ['HTML/CSS — confident', 'JavaScript (ES6+)', 'React or Vue — basics', 'Git', 'Responsive layout'],
        petProject: 'Responsive site or simple SPA: weather app, todo list, calculator. Deploy to Vercel or Netlify.',
        tip: 'Ability to convert a Figma design into code is a huge plus. Ask someone for a design file and implement it.',
      },
      {
        icon: '📱',
        title: 'Mobile Developer',
        skills: ['Flutter (Dart) or React Native', 'Working with APIs', 'Navigation, state management', 'Git'],
        petProject: 'Simple mobile app with multiple screens and external API calls. Post on GitHub with a README.',
        tip: 'Flutter is trending in Central Asia — many companies are looking for Flutter interns. Great entry point.',
      },
      {
        icon: '🧪',
        title: 'QA Engineer',
        skills: ['Test cases and checklists', 'Postman — API testing', 'Basic SQL', 'Bug reports', 'Jira or similar'],
        petProject: 'Write a test plan for a real website (e.g. a local e-commerce). Create real bug reports. Show in portfolio.',
        tip: 'QA is one of the most accessible entry points into IT. Companies hire QA interns more readily than developers.',
      },
      {
        icon: '📊',
        title: 'Business Analyst / Product Manager',
        skills: ['Understanding of product cycle', 'User stories, BRD', 'Figma — basics', 'SQL — basics', 'Metrics: DAU, retention, funnel'],
        petProject: 'Create a product case: pick a real product, describe its problems, propose improvements with metrics. Format as Notion or PDF.',
        tip: 'For PM, product awareness and understanding user behavior matters more than technical skills. Read cases, analyze products.',
      },
      {
        icon: '🤖',
        title: 'Data Scientist / ML / AI',
        skills: ['Python — confident', 'Pandas, NumPy', 'Sklearn — basic models', 'Jupyter Notebook', 'SQL'],
        petProject: 'Analyze a Kaggle dataset: EDA, visualization, simple model. Format as a Notebook with conclusions.',
        tip: 'Kaggle is your social network. Participate in competitions even if you place last. It\'s real experience.',
      },
      {
        icon: '🛠️',
        title: 'DevOps / SRE',
        skills: ['Linux — basic commands', 'Docker, Docker Compose', 'Git, CI/CD (GitHub Actions)', 'Nginx — basics', 'Bash scripts'],
        petProject: 'Deploy any pet project: Docker + Nginx + GitHub Actions CI. Describe how to run it in the README.',
        tip: 'Being able to deploy an application from scratch on a VPS is already enough for most internships in Central Asia.',
      },
    ],
  },
  steps: {
    title: 'Step-by-Step Plan',
    list: [
      { num: '01', title: 'Choose your specialty', text: 'Don\'t try to learn everything. Pick one direction and go deep. Better to know one thing well than five things shallowly.' },
      { num: '02', title: 'Learn the basic stack in 2–3 months', text: 'One language, core tools, understanding how applications are structured. You don\'t need to know everything — you need to know how to think.' },
      { num: '03', title: 'Build a pet project', text: 'One solid project on GitHub with a README, screenshots, and description. This is your portfolio and the main topic in your interview.' },
      { num: '04', title: 'Prepare your resume', text: 'One page. Pet projects with GitHub/deploy links. No fluff. Use a template from Notion or a local CV service.' },
      { num: '05', title: 'Apply massively', text: 'Don\'t wait for the perfect moment. Apply to 10–20 places at once. Responses are a funnel: from 20 come 5 interviews, from which 1–2 offers.' },
      { num: '06', title: 'Prepare for interviews', text: 'Review fundamentals, practice your intro and pet project story. Use interview questions on Jarlyq to prepare.' },
      { num: '07', title: 'Don\'t give up', text: 'The first rejection is normal. So is the second. The average path to a first internship is 2–4 months of active searching. Each rejection is feedback.' },
    ],
  },
  lifehacks: {
    title: 'Lifehacks',
    list: [
      { emoji: '⚡', title: 'Don\'t wait to be ready', text: 'Apply when you know 60% of the requirements. "I\'ll learn the rest on the job" is something most interns say.' },
      { emoji: '🌿', title: 'GitHub every day', text: 'Green squares signal activity. Commit something every day: fixes, README updates, refactoring.' },
      { emoji: '🎯', title: 'Quality over quantity', text: 'One deep pet project beats five shallow ones. Bring one to a working state and deploy it.' },
      { emoji: '🔍', title: 'Know the product', text: 'Before an interview, study the company\'s product as a user. Find bugs, suggest improvements — this surprises interviewers.' },
      { emoji: '📝', title: 'Personalize your CV', text: 'Don\'t send the same resume everywhere. Adjust emphasis to match the vacancy. Takes 5 minutes, much higher conversion.' },
      { emoji: '💬', title: 'Ask for feedback', text: 'After every rejection ask "what should I improve?". Most HR will respond and you\'ll get valuable signal.' },
      { emoji: '🤝', title: 'LinkedIn works', text: 'Add people after meetups and conferences. Message HR directly — it\'s normal in IT. Many internships are filled without postings.' },
      { emoji: '🏆', title: 'Hackathons = portfolio + network', text: 'In 48 hours you get a real project built in a team. Even a mid-table finish is a story for your interview.' },
    ],
  },
  network: {
    title: 'Networking, Hackathons & Meetups',
    subtitle: 'IT in Central Asia is a small world. Everyone knows everyone. One connection can change your career.',
    blocks: [
      {
        icon: '🤝',
        title: 'Networking',
        desc: 'Connections in IT work differently than in other fields. People here are open, willing to help, and recommend friends for vacancies. Start with online communities.',
        examples: ['Telegram chats: IT Community KZ, Flutter KZ, Python KZ', 'LinkedIn — add people after every event', 'Discord communities by tech stack', 'Local Slack workspaces of companies'],
      },
      {
        icon: '🏆',
        title: 'Hackathons',
        desc: 'A hackathon in 24–48 hours gives you: a real project built in a team, a network with developers and mentors, a resume line, and sometimes — a direct offer from the organizer.',
        examples: ['Digital Bridge (Astana)', 'Hack.kz', 'Astana Hub Hackathon', 'AITU Hackathon', 'Humo Hackathon (Tashkent)'],
      },
      {
        icon: '🎤',
        title: 'Meetups & Conferences',
        desc: 'Live events are the best way to meet practicing developers. Don\'t be afraid to approach and ask questions — it\'s expected behavior at IT events.',
        examples: ['GDG Almaty / GDG Bishkek', 'ReactConf KZ', 'PyDay Central Asia', 'DevFest Kazakhstan', 'Local meetups in community Notion calendars'],
      },
      {
        icon: '📖',
        title: 'Open Source',
        desc: 'Even a small PR in an open project is a line on your resume and real team experience with code review. Start with documentation or fixing typos.',
        examples: ['GitHub Explore — find a project in your stack', 'First Contributions — for beginners specifically', 'Local KZ/KG/UZ open source projects', 'Jarlyq — this project is open 😉'],
      },
    ],
  },
  timeline: {
    title: 'Realistic Timeline',
    subtitle: 'Everyone is different, but here\'s the average picture with active effort',
    items: [
      { month: 'Month 1–2', label: 'Fundamentals', desc: 'Learning the basic stack, doing exercises, watching tutorials. Chose a direction, figured out if you like it.' },
      { month: 'Month 3–4', label: 'Pet Project', desc: 'Building your first project from idea to deploy. Lots of Googling, getting stuck, solving problems — all normal.' },
      { month: 'Month 5', label: 'Preparation', desc: 'Polish your CV and GitHub. Start looking at vacancies, study common interview questions.' },
      { month: 'Month 6', label: 'Active Search', desc: 'Applying to 15–20 places. Going to interviews. Getting rejections, learning, improving.' },
      { month: 'Month 7–8', label: 'First Offer 🎉', desc: 'Average time to first internship with this approach. Some are faster, some slower — don\'t compare yourself to others.' },
    ],
  },
  cta: {
    title: 'Ready to Find an Internship?',
    subtitle: 'Jarlyq collects internships and vacancies from IT companies in Kazakhstan, Kyrgyzstan and Uzbekistan',
    button: 'Find Internships →',
  },
};

const kk: GuideContent = {
  meta: {
    title: 'IT тәжірибесіне қалай кіруге болады — толық нұсқаулық',
    description: 'Әзірлеушілер, QA, өнім менеджерлері, талдаушылар және деректер ғалымдары үшін IT тәжірибесін қалай табуға болатыны туралы қадамдық нұсқаулық.',
  },
  hero: {
    badge: '📖 Толық нұсқаулық',
    title: 'IT тәжірибесіне\nқалай кіруге болады',
    subtitle: 'Барлығына қажетті нәрсе — әзірлеушілерге, QA, өнім менеджерлеріне, талдаушылар мен деректер ғалымдарына. Нөлден бірінші ұсынысқа дейін.',
  },
  whatIs: {
    title: 'Тәжірибе дегеніміз не және ол не үшін керек',
    intro: 'Тәжірибе — бұл IT-дағы алғашқы нақты жұмысың. Нақты командада жұмыс жасайсың, нақты тапсырмаларды шешесің және ешбір курспен алмастыруға болмайтын тәжірибе аласың. Бұл оқу мен мансап арасындағы көпір.',
    types: [
      { icon: '💰', title: 'Ақылы', desc: 'Ірі IT-компаниялардың көпшілігі тәжірибешілерге төлейді. Деңгей — компания мен рөлге байланысты айына $200-ден $800-ге дейін.' },
      { icon: '🎓', title: 'Оқу (ақысыз)', desc: 'Сирек кездеседі. Компания өте тамаша болса және тәжірибе жалақының болмауынан маңызды болса ғана тиімді.' },
      { icon: '🏠', title: 'Қашықтан', desc: 'Барған сайын көп компания тәжірибешілерді қашықтан алады. Бұл басқа қалалар мен елдердегі компанияларға қол жеткізуді ашады.' },
      { icon: '🏢', title: 'Кеңседе', desc: 'Жаңадан бастаушылар үшін бағалырақ — тікелей байланыс арқылы тезірек үйренесің және желі құрасың.' },
      { icon: '🚀', title: 'Стартапта', desc: 'Бірінші күннен бастап көп жауапкершілік. Әртүрлі рөлдерді сынап көруге болады. Тәуекел жоғары, бірақ өсу жылдамырақ.' },
      { icon: '🏦', title: 'Корпорацияда', desc: 'Нақты процестер, ментор, оқыту. Қазақстанның банктері, телекомдары және ірі IT-компаниялары тәжірибешілерді белсенді алады.' },
    ],
  },
  formula: {
    title: 'Табыс формуласы',
    subtitle: 'Бұл құпия емес — табысты тәжірибешілердің 99%-ы осы жолдан өтті',
    items: [
      { icon: '📚', title: 'Курс немесе өзін-өзі оқыту', desc: 'YouTube, Stepik, Udemy, ресми құжаттама. Маңыздысы — дереккөз емес, негіздерді түсіну және өзіңнен-өзің үйрену. "Мінсіз" курсты күтпе — кез-келгенінен бастай бер.' },
      { icon: '🐾', title: 'Пет-жоба', desc: 'Жеке жоба — сұхбаттағы негізгі қарулың. HR және тимлид сертификаттарға емес, не істей алатыңа қарайды. GitHub-тағы бір жұмыс жасайтын пет-жоба он сертификаттан артық.' },
      { icon: '🔁', title: 'Қайталап жетілдір', desc: 'Жобаны жетілдіре бер, функциялар қос, қателерді түзет. Итерациялық жұмыс жасай алатыныңды көрсет — команда дәл осылай жұмыс жасайды.' },
    ],
    note: '💡 Кеңес: "дайын болғанша" күтпе. Талаптардың 60%-ын білгенде өтінім бер — қалғанын үдерісте үйренесің.',
  },
  specialties: {
    title: 'Мамандық бойынша кеңестер',
    subtitle: 'Әр рөлдің дайындықтың өз ерекшелігі бар',
    list: [
      {
        icon: '⚙️',
        title: 'Backend әзірлеуші',
        skills: ['Бір тілді жақсы (Go, Python, Java, Node.js)', 'REST API, HTTP әдістері', 'SQL — негізгі сұраулар', 'Git', 'Docker — негізі'],
        petProject: 'Қарапайым қолданба үшін REST API: тізім, ауа райы, жаңалықтар. Негізгі логиканы тесттермен жап.',
        tip: 'SQL білу және HTTP қалай жұмыс жасайтынын түсіндіре алу — кез-келген Backend-тәжірибешіге минимум.',
      },
      {
        icon: '🎨',
        title: 'Frontend әзірлеуші',
        skills: ['HTML/CSS — сенімді', 'JavaScript (ES6+)', 'React немесе Vue — негіздер', 'Git', 'Адаптивті верстка'],
        petProject: 'Адаптивті сайт немесе қарапайым SPA: ауа райы, тапсырмалар тізімі, калькулятор. Vercel немесе Netlify-ге орналастыр.',
        tip: 'Figma макетін верстай алу — үлкен плюс. Біреуден дизайн файлын сұра және орындап көр.',
      },
      {
        icon: '📱',
        title: 'Мобильді әзірлеуші',
        skills: ['Flutter (Dart) немесе React Native', 'API-мен жұмыс', 'Навигация, күй', 'Git'],
        petProject: 'Бірнеше экраны және сыртқы API қоңырауы бар қарапайым мобильді қолданба. README-мен GitHub-қа жүктеп қой.',
        tip: 'Flutter ОА-да трендте — көп компания Flutter-тәжірибешілерін іздейді. Бұл жақсы кіріс нүктесі.',
      },
      {
        icon: '🧪',
        title: 'QA инженері',
        skills: ['Тест-кейстер мен чек-листтер', 'Postman — API тестілеу', 'SQL негіздері', 'Баг-репорттар', 'Jira немесе ұқсас'],
        petProject: 'Нақты сайт үшін тест-жоспар жаз. Нақты баг-репорттар жаса. Портфолиода көрсет.',
        tip: 'QA — IT-ға кірудің ең қолжетімді нүктелерінің бірі. Компаниялар QA тәжірибешілерін әзірлеушілерден оңайырақ алады.',
      },
      {
        icon: '📊',
        title: 'Бизнес-талдаушы / Өнім менеджері',
        skills: ['Өнім циклін түсіну', 'Пайдаланушы хикаялары, BRD', 'Figma — негізі', 'SQL — негізі', 'Метрикалар: DAU, retention, funnel'],
        petProject: 'Өнім кейсі жаса: нақты өнімді ал, оның мәселелерін сипатта, метрикалармен жетілдіру ұсын. Notion немесе PDF ретінде рәсімде.',
        tip: 'PM үшін өнімдерді жақсы білу техникалық дағдыдан маңыздырақ. Кейстерді оқы, өнімдерді талда.',
      },
      {
        icon: '🤖',
        title: 'Деректер ғалымы / ML / AI',
        skills: ['Python — сенімді', 'Pandas, NumPy', 'Sklearn — негізгі модельдер', 'Jupyter Notebook', 'SQL'],
        petProject: 'Kaggle деректер жинағын талда: EDA, визуализация, қарапайым модель. Қорытындылары бар Notebook ретінде рәсімде.',
        tip: 'Kaggle — сенің әлеуметтік желің. Соңғы орынды алсаң да жарыстарға қатыс. Бұл нақты тәжірибе.',
      },
      {
        icon: '🛠️',
        title: 'DevOps / SRE',
        skills: ['Linux — негізгі командалар', 'Docker, Docker Compose', 'Git, CI/CD (GitHub Actions)', 'Nginx — негізі', 'Bash скриптері'],
        petProject: 'Кез-келген пет-жобаны орналастыр: Docker + Nginx + GitHub Actions CI. README-де іске қосу жолын сипатта.',
        tip: 'VPS-та қолданбаны нөлден орналастыра алу — ОА-дағы компаниялардың көпшілігіне тәжірибе алу үшін жеткілікті.',
      },
    ],
  },
  steps: {
    title: 'Қадамдық жоспар',
    list: [
      { num: '01', title: 'Мамандықты таңда', text: 'Барлығын үйренуге тырыспа. Бір бағытты таңда және тереңдет. Бірді жақсы білу бестен үстірт білуден жақсы.' },
      { num: '02', title: '2-3 айда негізгі стекті үйрен', text: 'Бір тіл, негізгі құралдар, қолданбалардың қалай жасалатынын түсіну. Барлығын білу міндетті емес — қалай ойлауды білу маңызды.' },
      { num: '03', title: 'Пет-жоба жаса', text: 'README, скриншоттар және сипаттамасы бар GitHub-тағы бір жақсы жоба. Бұл сенің портфолиоң және сұхбаттағы негізгі тақырып.' },
      { num: '04', title: 'Түйіндемеңді дайындa', text: 'Бір бет. GitHub/деплой сілтемелері бар пет-жобалар. Артық сөз жоқ. Notion немесе жергілікті CV қызметінің үлгісін пайдалан.' },
      { num: '05', title: 'Жаппай өтінім бер', text: 'Мінсіз сәтті күтпе. 10-20 жерге бір мезгілде өтінім бер. Жауаптар — бұл воронка: 20-дан 5 сұхбат келеді, олардан 1-2 ұсыныс.' },
      { num: '06', title: 'Сұхбатқа дайындал', text: 'Негіздерді қайталa, өзіңді таныстыруды және пет-жоба туралы әңгімеңді жаттығ. Jarlyq-тағы сұхбат сұрақтарын дайындалу үшін пайдалан.' },
      { num: '07', title: 'Бас тартпа', text: 'Бірінші бас тарту — қалыпты. Екіншісі де. Белсенді іздеуде бірінші тәжірибеге дейінгі орташа жол — 2-4 ай. Әр бас тарту — кері байланыс.' },
    ],
  },
  lifehacks: {
    title: 'Лайфхактар',
    list: [
      { emoji: '⚡', title: 'Дайындықты күтпе', text: 'Талаптардың 60%-ын білгенде өтінім бер. "Жолда үйренемін" — тәжірибешілердің көпшілігі айтатын сөз.' },
      { emoji: '🌿', title: 'GitHub-та күнделікті', text: 'Жасыл шаршылар белсенділік белгісі. Күнде бірдеңе commit жаса: түзетулер, README, рефакторинг.' },
      { emoji: '🎯', title: 'Сапа саннан жоғары', text: 'Бір терең пет-жоба бес үстірт жобадан жақсы. Бірін жұмыс күйіне жеткіз және орналастыр.' },
      { emoji: '🔍', title: 'Өнімді ішінен біл', text: 'Сұхбатқа дейін компанияның өнімін пайдаланушы ретінде зерттe. Қателерді тап, жетілдіру ұсын — бұл сұхбаткерді таңқалдырады.' },
      { emoji: '📝', title: 'CV-ны жекелендір', text: 'Бір түйіндемені барлық жерге жіберме. Вакансияға сай екпінді өзгерт. 5 минут уақыт алады, бірақ конверсия жоғарырақ.' },
      { emoji: '💬', title: 'Кері байланыс сұра', text: 'Әр бас тартудан кейін "нені жақсарту керек?" деп сұрa. HR-лардың көпшілігі жауап береді және бағалы сигнал аласың.' },
      { emoji: '🤝', title: 'LinkedIn жұмыс жасайды', text: 'Митаптар мен конференциялардан кейін адамдарды қос. HR-ға тікелей жаз — IT-да бұл қалыпты. Көп тәжірибелер жариялаусыз жабылады.' },
      { emoji: '🏆', title: 'Хакатондар = портфолио + желі', text: '48 сағатта командада жасалған нақты жоба аласың. Орта орын да — сұхбаттағы әңгіме.' },
    ],
  },
  network: {
    title: 'Желі, хакатондар және митаптар',
    subtitle: 'ОА-дағы IT — кішкентай әлем. Барлығы бір-бірін таниды. Бір таныс мансапыңды өзгерте алады.',
    blocks: [
      {
        icon: '🤝',
        title: 'Желі',
        desc: 'IT-тағы байланыстар басқа салалардан өзгеше жұмыс жасайды. Мұндағы адамдар ашық, көмектесуге дайын және вакансияларға таныстарын ұсынады. Онлайн-қауымдастықтардан бастa.',
        examples: ['Telegram-чаттар: IT Community KZ, Flutter KZ, Python KZ', 'LinkedIn — кез-келген іс-шарадан кейін қос', 'Стек бойынша Discord-қауымдастықтар', 'Жергілікті компаниялардың Slack-кеңістіктері'],
      },
      {
        icon: '🏆',
        title: 'Хакатондар',
        desc: 'Хакатон 24-48 сағатта береді: командада жасалған нақты жоба, әзірлеушілер мен менторлармен желі, түйіндемедегі жол, және кейде — ұйымдастырушыдан тікелей ұсыныс.',
        examples: ['Digital Bridge (Астана)', 'Hack.kz', 'Astana Hub Hackathon', 'AITU Hackathon', 'Humo Hackathon (Ташкент)'],
      },
      {
        icon: '🎤',
        title: 'Митаптар мен конференциялар',
        desc: 'Тікелей іс-шаралар — тәжірибелі әзірлеушілермен танысудың ең жақсы жолы. Жақындап сұрақ қоюдан қорықпа — IT іс-шараларында бұл күтілетін мінез.',
        examples: ['GDG Almaty / GDG Bishkek', 'ReactConf KZ', 'PyDay Central Asia', 'DevFest Kazakhstan', 'Қауымдастықтардың Notion күнтізбесіндегі жергілікті митаптар'],
      },
      {
        icon: '📖',
        title: 'Ашық бастапқы код',
        desc: 'Ашық жобадағы кішкентай PR да — code review-мен командадағы нақты тәжірибе. Құжаттамадан немесе теру қателерін түзетуден бастa.',
        examples: ['GitHub Explore — стегіңдегі жоба тап', 'First Contributions — жаңадан бастаушылар үшін арнайы', 'Жергілікті KZ/KG/UZ ашық бастапқы жобалар', 'Jarlyq — бұл жобаның өзі ашық 😉'],
      },
    ],
  },
  timeline: {
    title: 'Нақтылы уақыт кестесі',
    subtitle: 'Барлығы өзгеше, бірақ белсенді жұмыспен орташа картина осындай',
    items: [
      { month: '1–2 ай', label: 'Негіздер', desc: 'Негізгі стекті үйренесің, жаттығулар жасайсың, туториал қарайсың. Бағытты таңдадың, ұнайтынын анықтадың.' },
      { month: '3–4 ай', label: 'Пет-жоба', desc: 'Идеядан деплойға дейін алғашқы жобаны жасайсың. Көп іздейсің, тығырыққа тіреледің, шешесің — бұл қалыпты.' },
      { month: '5 ай', label: 'Дайындық', desc: 'CV мен GitHub-ты жылтыратасың. Вакансияларды қарай бастайсың, жиі сұрақтарды зерттейсің.' },
      { month: '6 ай', label: 'Белсенді іздеу', desc: '15-20 жерге өтінім бересің. Сұхбатқа барасың. Бас тарту аласың, үйренесің, жетілесің.' },
      { month: '7–8 ай', label: 'Бірінші ұсыныс 🎉', desc: 'Бұл тәсілмен бірінші тәжірибеге дейінгі орташа уақыт. Кейбіреулер тезірек, кейбіреулер ұзағырақ — өзіңді басқалармен салыстырма.' },
    ],
  },
  cta: {
    title: 'Тәжірибе іздеуге дайынсың ба?',
    subtitle: 'Jarlyq-та Қазақстан, Қырғызстан және Өзбекстанның IT-компанияларынан тәжірибелер мен бос орындар жинақталған',
    button: 'Тәжірибе табу →',
  },
};

export const guideContent: Record<Locale, GuideContent> = { ru, en, kk };
