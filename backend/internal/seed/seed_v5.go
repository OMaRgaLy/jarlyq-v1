package seed

import (
	"log"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

// SeedWorldUniversities adds top universities popular among Kazakhstani students.
func SeedWorldUniversities(db *gorm.DB) error {
	universities := []model.School{

		// ── Kazakhstan ──────────────────────────────────────────────
		{
			Name:    "Назарбаев Университет (NU)",
			Type:    "university",
			Country: "Kazakhstan",
			Description: "Флагманский исследовательский университет Казахстана в Астане. Обучение полностью на английском, международные партнёры (MIT, Duke, UCL). Гранты и стипендии для граждан РК. Сильные программы по CS, инженерии и медицине.",
			CoverURL:    "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://nu.edu.kz"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc)", Description: "Алгоритмы, AI, Networks, Software Engineering. 4 года, на английском.", ExternalURL: "https://nu.edu.kz/schools/sets", Format: "offline", DurationWeeks: 208, HasEmployment: true, Level: "bachelor", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 марта"},
				{Title: "Data Science (MSc)", Description: "ML, статистика, Big Data, Python. 2 года. Исследовательская магистратура.", ExternalURL: "https://nu.edu.kz/schools/sets", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 марта"},
			},
		},

		// ── UK ──────────────────────────────────────────────────────
		{
			Name:    "University of Edinburgh",
			Type:    "university_abroad",
			Country: "United Kingdom",
			Description: "Один из ведущих университетов Великобритании и мира (топ-20 QS). Сильный факультет информатики — колыбель языка Haskell. Много казахстанских студентов, скотландские стипендии.",
			Contacts:    model.ContactInfo{Website: "https://www.ed.ac.uk"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc/MEng)", Description: "AI, Programming Languages, Robotics, Cybersecurity. 4 года в Шотландии.", ExternalURL: "https://www.ed.ac.uk/studying/undergraduate/degrees/index.php?action=programme&code=G400", Format: "offline", HasEmployment: true, Level: "bachelor", Language: "en", ApplicationDeadline: "1 января"},
				{Title: "Informatics (MSc)", Description: "Исследовательская программа по AI, NLP, Machine Learning.", ExternalURL: "https://www.ed.ac.uk/informatics", Format: "offline", HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 января"},
			},
		},
		{
			Name:    "University of Manchester",
			Type:    "university_abroad",
			Country: "United Kingdom",
			Description: "Рассел-групп, топ-30 QS. Родина Алана Тьюринга — первый в мире хранимый компьютер был здесь. Отличная поддержка иностранных студентов, стипендии President's Doctoral Scholar.",
			Contacts:    model.ContactInfo{Website: "https://www.manchester.ac.uk"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc/MEng)", Description: "Algorithms, AI, Computer Vision, Distributed Systems. 3–4 года.", ExternalURL: "https://www.manchester.ac.uk/study/undergraduate/courses/2024/00560/bsc-computer-science/", Format: "offline", HasEmployment: true, Level: "bachelor", Language: "en", ApplicationDeadline: "1 января"},
			},
		},
		{
			Name:    "King's College London",
			Type:    "university_abroad",
			Country: "United Kingdom",
			Description: "Топ-40 QS, в самом центре Лондона. Сильные программы по CS, AI и информационной безопасности. Партнёрства с крупными tech-компаниями для стажировок.",
			Contacts:    model.ContactInfo{Website: "https://www.kcl.ac.uk"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc)", Description: "Software Engineering, AI, Security, Distributed Systems. 3 года.", ExternalURL: "https://www.kcl.ac.uk/study/undergraduate/courses/computer-science-bsc", Format: "offline", HasEmployment: true, Level: "bachelor", Language: "en", ApplicationDeadline: "1 января"},
			},
		},

		// ── Germany ─────────────────────────────────────────────────
		{
			Name:    "TU Munich (Technische Universität München)",
			Type:    "university_abroad",
			Country: "Germany",
			Description: "Лучший технический университет Германии, топ-30 QS. Обучение на английском на уровне магистратуры. Бесплатно или очень дёшево для иностранных студентов. Мюнхен — tech-столица Германии.",
			Contacts:    model.ContactInfo{Website: "https://www.tum.de"},
			Courses: []model.Course{
				{Title: "Informatics (MSc)", Description: "AI, Robotics, Software Engineering, Bioinformatics. На английском, бесплатно.", ExternalURL: "https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "15 июля"},
				{Title: "Data Engineering & Analytics (MSc)", Description: "Big Data, ML, Data Warehousing. На английском.", ExternalURL: "https://www.tum.de/en/studies/degree-programs", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "15 июля"},
			},
		},
		{
			Name:    "KIT (Karlsruhe Institute of Technology)",
			Type:    "university_abroad",
			Country: "Germany",
			Description: "Один из 9 элитных университетов Германии (Exzellenzinitiative). Сильнейшие программы по CS и инженерии. Бесплатное обучение, небольшой семестровый взнос ~170€.",
			Contacts:    model.ContactInfo{Website: "https://www.kit.edu"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc/MSc)", Description: "Algorithms, Systems, AI, Embedded Systems. Частично на английском.", ExternalURL: "https://www.kit.edu/english/studies/degree-programs/index.php", Format: "offline", DurationWeeks: 156, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "15 июля"},
			},
		},
		{
			Name:    "RWTH Aachen University",
			Type:    "university_abroad",
			Country: "Germany",
			Description: "Крупнейший технический университет Германии. Топ по Computer Science и Software Engineering. Магистратура на английском. Близость к Нидерландам и Бельгии.",
			Contacts:    model.ContactInfo{Website: "https://www.rwth-aachen.de"},
			Courses: []model.Course{
				{Title: "Software Systems Engineering (MSc)", Description: "Requirements Engineering, Architecture, Testing. Полностью на английском.", ExternalURL: "https://www.rwth-aachen.de/go/id/szz/lidx/1", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "15 июля"},
			},
		},

		// ── Switzerland ─────────────────────────────────────────────
		{
			Name:    "ETH Zurich",
			Type:    "university_abroad",
			Country: "Switzerland",
			Description: "Топ-7 QS, лучший технический университет Европы. Родина Эйнштейна. Обучение на немецком (бакалавр) и английском (магистр). Магистратура ~1500 CHF/семестр. Очень конкурентный отбор.",
			Contacts:    model.ContactInfo{Website: "https://ethz.ch"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "AI, Systems, Information Security, Data Science. На английском. 2 года.", ExternalURL: "https://inf.ethz.ch/studies/master.html", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "15 декабря"},
			},
		},
		{
			Name:    "EPFL (École Polytechnique Fédérale de Lausanne)",
			Type:    "university_abroad",
			Country: "Switzerland",
			Description: "Топ-20 QS. Расположен на берегу Женевского озера. Сильнейший по CS, AI и Robotics в Европе. Обучение на французском и английском. Campuses в Lausanne.",
			Contacts:    model.ContactInfo{Website: "https://www.epfl.ch"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "Algorithms, AI, Graphics, Distributed Computing. На английском.", ExternalURL: "https://www.epfl.ch/education/master/programs/computer-science/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "15 декабря"},
				{Title: "Data Science (MSc)", Description: "ML, Statistics, Big Data, Applied ML. Совместно с ETH.", ExternalURL: "https://www.epfl.ch/education/master/programs/data-science/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "15 декабря"},
			},
		},
		{
			Name:    "University of Zurich",
			Type:    "university_abroad",
			Country: "Switzerland",
			Description: "Крупнейший университет Швейцарии. Сильные программы по Information Systems и Computational Science. Хорошо сочетается с параллельными курсами ETH Zurich.",
			Contacts:    model.ContactInfo{Website: "https://www.uzh.ch"},
			Courses: []model.Course{
				{Title: "Computational Science & Technology (MSc)", Description: "HPC, Simulation, Data Analysis, Quantum Computing. На английском.", ExternalURL: "https://www.uzh.ch/en/studies/application/master.html", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "15 декабря"},
			},
		},

		// ── France ──────────────────────────────────────────────────
		{
			Name:    "École Polytechnique (l'X)",
			Type:    "university_abroad",
			Country: "France",
			Description: "Самая престижная Grandes École Франции, топ-30 QS по инженерии. Обучение на английском (программа Bachelor of Science и MSc). Сильная математическая подготовка. Военный статус, стипендии для иностранцев.",
			Contacts:    model.ContactInfo{Website: "https://www.polytechnique.edu"},
			Courses: []model.Course{
				{Title: "Cycle Ingénieur Polytechnicien", Description: "Математика, физика, CS, инженерия. 3 года. Военный диплом Франции.", ExternalURL: "https://programmes.polytechnique.edu/en/ingenieur-polytechnicien-program/ingenieur-polytechnicien-program", Format: "offline", HasEmployment: true, Level: "bachelor", Language: "fr", ApplicationDeadline: "1 марта"},
				{Title: "MSc&T Artificial Intelligence", Description: "Deep Learning, CV, NLP, Robotics. На английском. 2 года.", ExternalURL: "https://programmes.polytechnique.edu/en/master-all-msct-programs/msct-programs/artificial-intelligence", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 марта"},
			},
		},
		{
			Name:    "Sorbonne Université",
			Type:    "university_abroad",
			Country: "France",
			Description: "Один из старейших и крупнейших университетов мира (основан 1257). Сильный факультет математики и CS. Большое IT-сообщество, много программ на английском на уровне магистратуры.",
			Contacts:    model.ContactInfo{Website: "https://www.sorbonne-universite.fr"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "Algorithms, Machine Learning, Networks. На французском/английском.", ExternalURL: "https://sciences.sorbonne-universite.fr/en/education-sciences", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "fr", ApplicationDeadline: "1 марта"},
			},
		},
		{
			Name:    "Université Paris-Saclay",
			Type:    "university_abroad",
			Country: "France",
			Description: "Топ-15 QS, создан слиянием лучших технических школ Франции. Входит в мировой топ по математике и CS. Обучение на английском на уровне магистратуры, многие программы бесплатны (~170€/год).",
			Contacts:    model.ContactInfo{Website: "https://www.universite-paris-saclay.fr"},
			Courses: []model.Course{
				{Title: "Machine Learning (MSc)", Description: "Совместная программа с ENS Paris-Saclay и CentraleSupélec. Лучшая ML-магистратура Франции.", ExternalURL: "https://www.universite-paris-saclay.fr/en/education/master/computer-science/m2-machine-learning", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 марта"},
			},
		},

		// ── Italy ───────────────────────────────────────────────────
		{
			Name:    "Politecnico di Milano",
			Type:    "university_abroad",
			Country: "Italy",
			Description: "Лучший технический университет Италии, топ-130 QS. Программы на английском, относительно доступные взносы ~4000€/год. Сильный по Design, CS и инженерии. Милан — fashion и tech столица Европы.",
			Contacts:    model.ContactInfo{Website: "https://www.polimi.it"},
			Courses: []model.Course{
				{Title: "Computer Science Engineering (MSc)", Description: "AI, Cybersecurity, Software Engineering, HCI. На английском. 2 года.", ExternalURL: "https://www.polimi.it/en/programmes/laurea-magistrale-equivalent-to-master-of-science-msc", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 апреля"},
			},
		},
		{
			Name:    "Politecnico di Torino",
			Type:    "university_abroad",
			Country: "Italy",
			Description: "Второй ведущий технический университет Италии. Бесплатные Masters для студентов с высокими оценками. Отличные программы по Computer Engineering и Data Science.",
			Contacts:    model.ContactInfo{Website: "https://www.polito.it"},
			Courses: []model.Course{
				{Title: "Computer Engineering (MSc)", Description: "Embedded Systems, IoT, Software Engineering, Networks. На английском.", ExternalURL: "https://www.polito.it/en/education/master-s-degree-programmes", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 апреля"},
				{Title: "Data Science & Engineering (MSc)", Description: "Big Data, ML, Cloud, Analytics. На английском.", ExternalURL: "https://www.polito.it/en/education/master-s-degree-programmes", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 апреля"},
			},
		},
		{
			Name:    "Università di Bologna",
			Type:    "university_abroad",
			Country: "Italy",
			Description: "Старейший университет мира (основан 1088). Топ-180 QS. Много программ на английском, доступные взносы ~3000€/год. Болонья — уютный студенческий город.",
			Contacts:    model.ContactInfo{Website: "https://www.unibo.it"},
			Courses: []model.Course{
				{Title: "Artificial Intelligence (MSc)", Description: "ML, Robotics, Cognitive Systems, NLP. На английском. Международная когорта.", ExternalURL: "https://corsi.unibo.it/2cycle/ArtificialIntelligence", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 апреля"},
			},
		},

		// ── Norway ──────────────────────────────────────────────────
		{
			Name:    "NTNU (Norwegian University of Science and Technology)",
			Type:    "university_abroad",
			Country: "Norway",
			Description: "Крупнейший технический университет Норвегии, топ-400 QS. Бесплатное обучение для всех (включая иностранцев!) — только семестровый взнос ~700 NOK. Трондхейм — безопасный, чистый город. Сильная по энергетике, CS и робототехнике.",
			Contacts:    model.ContactInfo{Website: "https://www.ntnu.edu"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "AI, Algorithms, Software Engineering, HCI. На английском, бесплатно.", ExternalURL: "https://www.ntnu.edu/studies/mcs", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 февраля"},
			},
		},

		// ── Sweden ──────────────────────────────────────────────────
		{
			Name:    "KTH Royal Institute of Technology",
			Type:    "university_abroad",
			Country: "Sweden",
			Description: "Лучший технический университет Скандинавии, топ-90 QS. Стокгольм — европейский hub стартапов (Spotify, Klarna, Mojang родились здесь). Обучение на английском, стипендии Swedish Institute.",
			Contacts:    model.ContactInfo{Website: "https://www.kth.se"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "Algorithms, Machine Learning, Distributed Systems, Cybersecurity. На английском. 2 года.", ExternalURL: "https://www.kth.se/en/studies/master/computer-science", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 февраля"},
				{Title: "Machine Learning (MSc)", Description: "Deep Learning, Computer Vision, Statistical ML, Optimization. На английском.", ExternalURL: "https://www.kth.se/en/studies/master/machinelearning", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 февраля"},
			},
		},

		// ── Spain ───────────────────────────────────────────────────
		{
			Name:    "Universidad Politécnica de Madrid (UPM)",
			Type:    "university_abroad",
			Country: "Spain",
			Description: "Крупнейший технический университет Испании. Сильные программы по Computer Science и Software Engineering. Испания — доступные цены на жильё, тёплый климат, большое студенческое сообщество из СНГ.",
			Contacts:    model.ContactInfo{Website: "https://www.upm.es"},
			Courses: []model.Course{
				{Title: "Artificial Intelligence (MSc)", Description: "ML, Deep Learning, Computer Vision, NLP. На испанском/английском.", ExternalURL: "https://www.upm.es/Estudiantes/Estudios_Titulaciones", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июня"},
			},
		},
		{
			Name:    "IE University",
			Type:    "university_abroad",
			Country: "Spain",
			Description: "Инновационный университет в Мадриде и Сеговии. Входит в топ-20 технологических программ в Европе. Сильный акцент на предпринимательство + технологии. Обучение полностью на английском.",
			Contacts:    model.ContactInfo{Website: "https://www.ie.edu"},
			Courses: []model.Course{
				{Title: "Master in Computer Science & AI", Description: "Software Engineering, AI, Entrepreneurship. На английском. 1–2 года.", ExternalURL: "https://www.ie.edu/school-science-technology/masters/master-computer-science-artificial-intelligence/", Format: "offline", DurationWeeks: 52, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июня"},
			},
		},
		{
			Name:    "Universitat Politècnica de Catalunya (UPC)",
			Type:    "university_abroad",
			Country: "Spain",
			Description: "Ведущий технический университет Каталонии, Барселона. Сильные программы по CS и инженерии, развитая IT-экосистема. Барселона — второй по популярности город для IT-специалистов в Европе.",
			Contacts:    model.ContactInfo{Website: "https://www.upc.edu"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "Computing, AI, Data Engineering. На английском.", ExternalURL: "https://www.upc.edu/en/masters", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июня"},
			},
		},

		// ── Poland ──────────────────────────────────────────────────
		{
			Name:    "Warsaw University of Technology (PW)",
			Type:    "university_abroad",
			Country: "Poland",
			Description: "Лучший технический университет Польши. Варшава — быстро растущий IT-хаб Европы. Доступные цены, много программ на английском, невысокие требования к IELTS. Популярен среди студентов из Казахстана и Кыргызстана.",
			Contacts:    model.ContactInfo{Website: "https://www.pw.edu.pl"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "Software Engineering, AI, Networks. На английском. 1.5–2 года.", ExternalURL: "https://www.pw.edu.pl/enpl/Studies/Graduate-Studies", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июля"},
			},
		},
		{
			Name:    "AGH University of Science and Technology",
			Type:    "university_abroad",
			Country: "Poland",
			Description: "Технический университет в Кракове — одном из красивейших городов Европы. Сильные программы по CS, Data Science и автоматизации. Очень доступные цены на жильё и питание.",
			Contacts:    model.ContactInfo{Website: "https://www.agh.edu.pl"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "AI, Software Engineering, Data Science. На английском.", ExternalURL: "https://www.agh.edu.pl/en/study/offer/master-studies", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июля"},
			},
		},
		{
			Name:    "University of Warsaw",
			Type:    "university_abroad",
			Country: "Poland",
			Description: "Крупнейший и ведущий классический университет Польши, топ-300 QS. Сильный факультет математики и информатики — выпускники регулярно берут медали на IOI и ICPC.",
			Contacts:    model.ContactInfo{Website: "https://www.uw.edu.pl"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "Algorithms, Theoretical CS, AI, Databases. Программа сильная в алгоритмике.", ExternalURL: "https://www.uw.edu.pl/en/studying-at-uw/offer-for-students/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июля"},
			},
		},

		// ── Czech Republic ──────────────────────────────────────────
		{
			Name:    "Czech Technical University in Prague (ČVUT)",
			Type:    "university_abroad",
			Country: "Czech Republic",
			Description: "Старейший технический университет Центральной Европы (основан 1707), топ-500 QS. Прага — недорогой, красивый город в центре Европы. Много программ на английском, доступное обучение.",
			Contacts:    model.ContactInfo{Website: "https://www.cvut.cz"},
			Courses: []model.Course{
				{Title: "Open Informatics (BSc/MSc)", Description: "AI, Cybersecurity, Software Engineering, Robotics. На английском.", ExternalURL: "https://oi.fel.cvut.cz/en/", Format: "offline", DurationWeeks: 156, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июля"},
			},
		},
		{
			Name:    "Charles University Prague",
			Type:    "university_abroad",
			Country: "Czech Republic",
			Description: "Старейший университет Центральной Европы (основан 1348), топ-200 QS. Сильный факультет математики и физики. Программа Computer Science читается на английском.",
			Contacts:    model.ContactInfo{Website: "https://cuni.cz"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "Theoretical CS, Programming Languages, AI. На английском.", ExternalURL: "https://www.mff.cuni.cz/en/admissions/master-studies", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 июля"},
			},
		},

		// ── USA / Canada ─────────────────────────────────────────────
		{
			Name:    "MIT (Massachusetts Institute of Technology)",
			Type:    "university_abroad",
			Country: "USA",
			Description: "Лучший университет мира по QS. Кузница инноваций: MIT Media Lab, CSAIL, Lincoln Lab. Поступить крайне сложно, но есть стипендии и финансовая помощь. OpenCourseWare — часть курсов доступна бесплатно онлайн.",
			CoverURL:    "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://www.mit.edu"},
			Courses: []model.Course{
				{Title: "Computer Science & Engineering (BSc)", Description: "Algorithms, Systems, AI, Theory of Computation. 4 года. Scholarship needs-blind для иностранцев.", ExternalURL: "https://www.eecs.mit.edu/academics-admissions/undergraduate-programs/6-3-computer-science-engineering", Format: "offline", DurationWeeks: 208, HasEmployment: true, Level: "bachelor", Language: "en", ApplicationDeadline: "1 декабря"},
				{Title: "EECS (MEng/MSc)", Description: "Graduate программы по AI, Robotics, Systems, Security.", ExternalURL: "https://www.eecs.mit.edu/academics-admissions/graduate-programs", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 декабря"},
			},
		},
		{
			Name:    "Carnegie Mellon University (CMU)",
			Type:    "university_abroad",
			Country: "USA",
			Description: "Топ-1 по Computer Science в США по многим рейтингам. School of Computer Science — легенда. Выпускники основали или работали в Google, Apple, Intel. Сильный по AI, HCI, Robotics, Software Engineering.",
			Contacts:    model.ContactInfo{Website: "https://www.cmu.edu"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc)", Description: "Algorithms, Systems, AI, Theory. Жёсткий отбор, но мировой уровень.", ExternalURL: "https://www.cs.cmu.edu/academics/undergraduate", Format: "offline", DurationWeeks: 208, HasEmployment: true, Level: "bachelor", Language: "en", ApplicationDeadline: "1 декабря"},
				{Title: "Machine Learning (MSc/PhD)", Description: "Лучшая ML-программа в США. Deep Learning, CV, NLP, Reinforcement Learning.", ExternalURL: "https://www.ml.cmu.edu/academics/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 декабря"},
			},
		},
		{
			Name:    "University of Waterloo",
			Type:    "university_abroad",
			Country: "Canada",
			Description: "Лучший CS-университет Канады, топ-3 в Северной Америке по Computer Science. Уникальная программа Co-op — 6 оплачиваемых стажировок за 5 лет (в Google, Amazon, etc). Сильное СНГ-сообщество.",
			Contacts:    model.ContactInfo{Website: "https://uwaterloo.ca"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc)", Description: "Algorithms, Systems, AI, Software Eng. Co-op программа — оплачиваемые стажировки каждый семестр.", ExternalURL: "https://uwaterloo.ca/future-students/courses/computer-science", Format: "offline", DurationWeeks: 260, HasEmployment: true, Level: "bachelor", Language: "en", ApplicationDeadline: "1 декабря"},
				{Title: "Data Science (MSc)", Description: "ML, Statistics, Big Data. 1.5 года.", ExternalURL: "https://uwaterloo.ca/graduate-studies-academic-calendar/", Format: "offline", DurationWeeks: 78, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 декабря"},
			},
		},
		{
			Name:    "University of Toronto",
			Type:    "university_abroad",
			Country: "Canada",
			Description: "Топ-25 QS, крупнейший университет Канады. Центр AI-исследований — именно здесь Hinton, LeCun и Bengio создавали глубокое обучение. Торонто — мультикультурный город, легко получить PR.",
			Contacts:    model.ContactInfo{Website: "https://www.utoronto.ca"},
			Courses: []model.Course{
				{Title: "Computer Science (BSc)", Description: "AI, Systems, Theory, Data. Один из лучших CS в мире.", ExternalURL: "https://web.cs.toronto.edu/undergraduate", Format: "offline", DurationWeeks: 208, HasEmployment: true, Level: "bachelor", Language: "en", ApplicationDeadline: "1 декабря"},
				{Title: "Applied Computing (MScAC)", Description: "Профессиональная магистратура с internship в Toronto tech-компаниях. 1 год.", ExternalURL: "https://mscac.utoronto.ca/", Format: "offline", DurationWeeks: 52, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 декабря"},
			},
		},
		{
			Name:    "Stanford University",
			Type:    "university_abroad",
			Country: "USA",
			Description: "Топ-5 QS, Кремниевая долина прямо за воротами. Основатели Google, Yahoo, Instagram — выпускники Стэнфорда. Крайне конкурентный отбор, но финансовая помощь для иностранных студентов.",
			Contacts:    model.ContactInfo{Website: "https://www.stanford.edu"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc)", Description: "AI, Systems, HCI, Theory, Biocomputation. Специализации на выбор.", ExternalURL: "https://cs.stanford.edu/academics/masters", Format: "offline", DurationWeeks: 78, HasEmployment: true, Level: "master", Language: "en", ApplicationDeadline: "1 декабря"},
			},
		},

		// ── China ────────────────────────────────────────────────────
		{
			Name:    "Tsinghua University",
			Type:    "university_abroad",
			Country: "China",
			Description: "Топ-25 QS, лучший университет Азии по инженерии и CS. Программа для иностранных студентов на английском. Стипендии правительства Китая (CSC) покрывают обучение и проживание. Пекин — огромные возможности для стажировок в Baidu, ByteDance, Tencent.",
			Contacts:    model.ContactInfo{Website: "https://www.tsinghua.edu.cn/en/"},
			Courses: []model.Course{
				{Title: "Computer Science & Technology (MSc)", Description: "AI, Systems, Networks, Software. На английском для иностранцев. Стипендия CSC.", ExternalURL: "https://www.tsinghua.edu.cn/en/Admissions/Graduate_Admissions.htm", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},
		{
			Name:    "Peking University (PKU / Beida)",
			Type:    "university_abroad",
			Country: "China",
			Description: "Топ-17 QS. Сильнейший по Computer Science и математике в Китае. Программы на английском для graduate students. Стипендия CSC + стипендии самого университета. Пекин, рядом с tech-гигантами.",
			Contacts:    model.ContactInfo{Website: "https://english.pku.edu.cn"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc/PhD)", Description: "AI, Algorithms, Systems, Data Science. Исследовательские группы мирового уровня.", ExternalURL: "https://english.pku.edu.cn/Admission/index.htm", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},
		{
			Name:    "Shanghai Jiao Tong University (SJTU)",
			Type:    "university_abroad",
			Country: "China",
			Description: "Топ-50 QS, Shanghai. Известен своим ежегодным рейтингом ARWU (Шанхайский рейтинг). Сильный Engineering и CS. Шанхай — финансовый и tech-центр Китая. Большое сообщество иностранных студентов из СНГ.",
			Contacts:    model.ContactInfo{Website: "https://en.sjtu.edu.cn"},
			Courses: []model.Course{
				{Title: "Computer Science & Engineering (MSc)", Description: "Software Engineering, AI, Big Data. На английском.", ExternalURL: "https://en.sjtu.edu.cn/future-students/graduate-admissions/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},
		{
			Name:    "Zhejiang University",
			Type:    "university_abroad",
			Country: "China",
			Description: "Топ-60 QS, Ханчжоу — штаб-квартира Alibaba. Один из самых инновационных университетов Китая. Программы на английском, стипендии CSC. Сильная кооперация с Alibaba, NetEase, Dahua.",
			Contacts:    model.ContactInfo{Website: "https://www.zju.edu.cn/english/"},
			Courses: []model.Course{
				{Title: "Computer Science & Technology (MSc)", Description: "AI, Computer Vision, Software Engineering. Доступ к исследованиям Alibaba DAMO.", ExternalURL: "https://www.zju.edu.cn/english/2018/0523/c19573a831582/page.htm", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},
		{
			Name:    "Fudan University",
			Type:    "university_abroad",
			Country: "China",
			Description: "Топ-50 QS, Шанхай. Один из «C9» — девяти элитных университетов Китая. Сильный по Big Data, AI и Software Engineering. Стипендии Shanghai Municipal Government для иностранцев.",
			Contacts:    model.ContactInfo{Website: "https://www.fudan.edu.cn/en/"},
			Courses: []model.Course{
				{Title: "Data Science (MSc)", Description: "Big Data, ML, Statistical Analysis, Python. На английском.", ExternalURL: "https://www.fudan.edu.cn/en/2022/0224/c343a120547/page.htm", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},

		// ── Korea ───────────────────────────────────────────────────
		{
			Name:    "KAIST (Korea Advanced Institute of Science and Technology)",
			Type:    "university_abroad",
			Country: "South Korea",
			Description: "Топ-65 QS, лучший технический университет Азии по ряду рейтингов. Обучение на английском, бесплатно для зачисленных в магистратуру/PhD (stipend). Дэджон — tech-город Кореи. Выпускники работают в Samsung, LG, Kakao.",
			Contacts:    model.ContactInfo{Website: "https://www.kaist.ac.kr/en/"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc/PhD)", Description: "AI, Systems, Cybersecurity, Human-Computer Interaction. На английском, бесплатно со стипендией.", ExternalURL: "https://cs.kaist.ac.kr/education/graduate", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},
		{
			Name:    "Seoul National University (SNU)",
			Type:    "university_abroad",
			Country: "South Korea",
			Description: "Топ-35 QS, самый престижный университет Кореи. «Гарвард Азии». Программы на английском. Стипендия GKS (Global Korea Scholarship) покрывает всё — учёбу, проживание, перелёт. Сеул — мировой лидер по скорости интернета и tech-инфраструктуре.",
			Contacts:    model.ContactInfo{Website: "https://en.snu.ac.kr"},
			Courses: []model.Course{
				{Title: "Computer Science & Engineering (MSc)", Description: "AI, Algorithms, Database Systems, Networks. На английском.", ExternalURL: "https://cse.snu.ac.kr/en/graduate/course", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},
		{
			Name:    "POSTECH (Pohang University of Science and Technology)",
			Type:    "university_abroad",
			Country: "South Korea",
			Description: "Небольшой элитный технический университет Кореи, топ-150 QS. Сооснован POSCO (крупнейшая сталелитейная компания). Исследовательский фокус, очень высокое соотношение профессор/студент. Стипендии для иностранцев.",
			Contacts:    model.ContactInfo{Website: "https://www.postech.ac.kr/eng/"},
			Courses: []model.Course{
				{Title: "Computer Science & Engineering (MSc)", Description: "Systems, AI, Software Engineering. Исследовательская программа.", ExternalURL: "https://cse.postech.ac.kr/graduate/programs/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "31 марта"},
			},
		},

		// ── Japan ───────────────────────────────────────────────────
		{
			Name:    "University of Tokyo (UTokyo)",
			Type:    "university_abroad",
			Country: "Japan",
			Description: "Топ-28 QS, лучший университет Японии. Программа MEXT (японское государственное министерство) покрывает обучение + даёт стипендию ~145 000 ¥/мес. Токио — безопасный, технологичный город. Выпускники в Sony, Fujitsu, NTT, Toyota Research.",
			Contacts:    model.ContactInfo{Website: "https://www.u-tokyo.ac.jp/en/"},
			Courses: []model.Course{
				{Title: "Computer Science (MSc/PhD)", Description: "AI, Robotics, Systems, HCI. Программа на английском. Стипендия MEXT.", ExternalURL: "https://www.u-tokyo.ac.jp/en/admissions/graduate/e01.html", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 мая"},
			},
		},
		{
			Name:    "Kyoto University",
			Type:    "university_abroad",
			Country: "Japan",
			Description: "Топ-55 QS, второй по престижу в Японии. Сильный по фундаментальным наукам, AI и биоинформатике. Стипендия MEXT. Киото — культурная столица Японии, спокойный студенческий город.",
			Contacts:    model.ContactInfo{Website: "https://www.kyoto-u.ac.jp/en"},
			Courses: []model.Course{
				{Title: "Informatics (MSc)", Description: "Intelligence Science, Systems Science, Social Informatics. На английском.", ExternalURL: "https://www.soci.kyoto-u.ac.jp/en/graduate/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 мая"},
			},
		},
		{
			Name:    "Tokyo Institute of Technology (Tokyo Tech)",
			Type:    "university_abroad",
			Country: "Japan",
			Description: "Топ-55 QS, лучший технический университет Японии по инженерии и CS. Программа MEXT. Сильная по робототехнике, AI и материаловедению. В 2024 объединился с Tokyo Medical and Dental University → Tokyo Tech стал Institute of Science Tokyo.",
			Contacts:    model.ContactInfo{Website: "https://www.titech.ac.jp/english/"},
			Courses: []model.Course{
				{Title: "Computing (MSc)", Description: "Algorithms, AI, Networks, Mathematical Informatics. На английском, стипендия MEXT.", ExternalURL: "https://www.titech.ac.jp/english/graduate/", Format: "offline", DurationWeeks: 104, HasEmployment: true, Level: "master", Language: "en", ScholarshipAvailable: true, ApplicationDeadline: "1 мая"},
			},
		},
	}

	for _, s := range universities {
		seedSchoolByName(db, s)
	}
	log.Printf("SeedWorldUniversities: added %d universities", len(universities))
	return nil
}
