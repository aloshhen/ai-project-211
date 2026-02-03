import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { clsx, twMerge } from 'tailwind-merge'

// SafeIcon Component - handles all Lucide icons
const SafeIcon = ({ name, size = 24, className = '', color }) => {
  const [Icon, setIcon] = useState(null)
  
  useEffect(() => {
    import('lucide-react').then((icons) => {
      const iconName = name.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('')
      const FoundIcon = icons[iconName] || icons.HelpCircle
      setIcon(() => FoundIcon)
    })
  }, [name])
  
  if (!Icon) return <div style={{ width: size, height: size }} className={className} />
  
  return <Icon size={size} className={className} color={color} />
}

// Utility for tailwind class merging
const cn = (...inputs) => twMerge(clsx(inputs))

// Web3Forms Hook
const useFormHandler = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const handleSubmit = async (e, accessKey) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsError(false)
    
    const formData = new FormData(e.target)
    formData.append('access_key', accessKey)
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        e.target.reset()
      } else {
        setIsError(true)
        setErrorMessage(data.message || 'Something went wrong')
      }
    } catch (error) {
      setIsError(true)
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const resetForm = () => {
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage('')
  }
  
  return { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm }
}

// Clean Map Component with MapLibre
const CleanMap = ({ coordinates = [14.4378, 50.0755], zoom = 14, markers = [] }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return

    const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: coordinates,
      zoom: zoom,
      attributionControl: false,
      interactive: true,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: false,
      doubleClickZoom: true,
      keyboard: false
    })

    map.current.scrollZoom.disable()

    const el = document.createElement('div')
    el.style.cssText = `
      width: 32px;
      height: 32px;
      background: #dc2626;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
      cursor: pointer;
    `
    
    new maplibregl.Marker({ element: el })
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong style="color: #000;">BAZA Barbershop</strong><br/>Prague'))
      .addTo(map.current)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates, zoom, markers])

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
      <style>{`
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-logo { display: none !important; }
        .maplibregl-compact { display: none !important; }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  )
}

// FAQ Data for Chat Widget
const FAQ_DATA = [
  {
    question: "Как записаться на стрижку?",
    answer: "Вы можете записаться онлайн через форму на нашем сайте или позвонить нам по телефону +420 123 456 789. Работаем ежедневно с 10:00 до 20:00.",
    keywords: ["запись", "записаться", "стрижка", "онлайн", "телефон"]
  },
  {
    question: "Сколько стоит стрижка?",
    answer: "Мужская стрижка — 800 CZK, борода — 500 CZK, комплекс — 1200 CZK. Королевское бритьё — 700 CZK. Для студентов скидка 10%.",
    keywords: ["цена", "сколько", "стоит", "прайс", "стоимость", "czk"]
  },
  {
    question: "Где вы находитесь?",
    answer: "Мы находимся в центре Праги по адресу: Václavské náměstí 15, Praha 1. Рядом со станцией метро Můstek.",
    keywords: ["где", "адрес", "местоположение", "прага", "карта", "находиться"]
  },
  {
    question: "Нужно ли записываться заранее?",
    answer: "Да, рекомендуем записываться заранее, особенно на выходные. Однако принимаем и walk-in клиентов при наличии свободного времени.",
    keywords: ["предварительно", "заранее", "walk-in", "без записи"]
  },
  {
    question: "Какие услуги вы предоставляете?",
    answer: "Мы предлагаем мужские стрижки, оформление бороды, королевское бритьё опасной бритвой, уход за волосами и камуфляж седины.",
    keywords: ["услуги", "что", "предоставляете", "борода", "бритьё"]
  }
]

const SITE_CONTEXT = "BAZA Barbershop - премиальный барбершоп в центре Праги. Предлагаем мужские стрижки, оформление бороды, королевское бритьё. Работаем с 10:00 до 20:00. Адрес: Václavské náměstí 15, Praha 1."

// Chat Widget Component
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Привет! Я помощник BAZA Barbershop. Чем могу помочь?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findAnswer = (question) => {
    const lowerQuestion = question.toLowerCase()
    for (const faq of FAQ_DATA) {
      if (faq.keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return faq.answer
      }
    }
    return null
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return
    
    const userMessage = inputValue.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInputValue('')
    setIsLoading(true)

    const localAnswer = findAnswer(userMessage)
    
    if (localAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: localAnswer }])
        setIsLoading(false)
      }, 500)
    } else {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, context: SITE_CONTEXT })
        })
        
        if (response.ok) {
          const data = await response.json()
          setMessages(prev => [...prev, { type: 'bot', text: data.reply }])
        } else {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            text: 'Извините, я не совсем понял. Попробуйте спросить о записи, ценах или нашем адресе.' 
          }])
        }
      } catch (error) {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: 'Свяжитесь с нами по телефону +420 123 456 789 для более подробной информации.' 
        }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full shadow-2xl shadow-red-600/40 flex items-center justify-center border-2 border-white/20"
      >
        <SafeIcon name={isOpen ? 'x' : 'message-square'} size={24} className="text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden"
          >
            <div className="bg-red-600 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <SafeIcon name="bot" size={18} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">BAZA Assistant</h4>
                <p className="text-white/70 text-xs">Обычно отвечает моментально</p>
              </div>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    msg.type === 'user' 
                      ? "bg-red-600 text-white ml-auto rounded-br-md"
                      : "bg-gray-800 text-gray-200 rounded-bl-md"
                  )}
                >
                  {msg.text}
                </motion.div>
              ))}
              {isLoading && (
                <div className="bg-gray-800 text-gray-200 p-3 rounded-2xl rounded-bl-md max-w-[85%] flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-800 bg-gray-900/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Напишите сообщение..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !inputValue.trim()}
                  className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-xl flex items-center justify-center transition-colors"
                >
                  <SafeIcon name="send" size={18} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Services Data
const SERVICES = [
  {
    name: "Мужская стрижка",
    price: "800 CZK",
    duration: "45 мин",
    description: "Классическая или современная стрижка с мытьём головы и укладкой",
    icon: "scissors"
  },
  {
    name: "Оформление бороды",
    price: "500 CZK",
    duration: "30 мин",
    description: "Подравнивание, моделирование и уход за бородой",
    icon: "flame"
  },
  {
    name: "Комплекс",
    price: "1200 CZK",
    duration: "75 мин",
    description: "Стрижка + борода с комплексным уходом",
    icon: "crown"
  },
  {
    name: "Королевское бритьё",
    price: "700 CZK",
    duration: "40 мин",
    description: "Бритьё опасной бритвой с горячими полотенцами",
    icon: "sparkles"
  },
  {
    name: "Уход за волосами",
    price: "400 CZK",
    duration: "20 мин",
    description: "Маска, скраб и восстанавливающий уход",
    icon: "droplets"
  },
  {
    name: "Камуфляж седины",
    price: "600 CZK",
    duration: "30 мин",
    description: "Тонирование седых волос на 2-3 недели",
    icon: "palette"
  }
]

// Gallery Images
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80",
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80"
]

// Reviews Data
const REVIEWS = [
  {
    name: "Александр М.",
    text: "Лучший барбершоп в Праге! Атмосфера, сервис, качество — всё на высоте. Теперь хожу только сюда.",
    rating: 5,
    date: "2 недели назад"
  },
  {
    name: "Дмитрий К.",
    text: "Наконец-то нашёл своего барбера. Понимают что хочешь без лишних слов. Стрижка держится идеально.",
    rating: 5,
    date: "месяц назад"
  },
  {
    name: "Иван П.",
    text: "Королевское бритьё — это нечто. Расслабляющая процедура, результат превосходный. Рекомендую!",
    rating: 5,
    date: "2 месяца назад"
  }
]

// Blog Posts
const BLOG_POSTS = [
  {
    title: "Как правильно ухаживать за бородой зимой",
    excerpt: "Зимой борода требует особого внимания. Холод и ветер сушат волосы...",
    image: "https://images.unsplash.com/photo-1621515373631-6364634223a3?w=600&q=80",
    date: "15 января 2024"
  },
  {
    title: "Топ-5 стрижек 2024 года",
    excerpt: "Разбираем самые трендовые мужские стрижки этого года и как их носить...",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
    date: "10 января 2024"
  },
  {
    title: "Выбор правильного шампуня",
    excerpt: "Как подобрать шампунь под тип волос и почему это важно для здоровья...",
    image: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&q=80",
    date: "5 января 2024"
  }
]

// Instagram Posts (Mock)
const INSTAGRAM_POSTS = [
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80"
]

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

function App() {
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const heroRef = useRef(null)
  const servicesRef = useRef(null)
  const galleryRef = useRef(null)
  const bookingRef = useRef(null)
  const blogRef = useRef(null)
  const reviewsRef = useRef(null)
  const contactsRef = useRef(null)
  
  const heroInView = useInView(heroRef, { once: true })
  const servicesInView = useInView(servicesRef, { once: true, margin: "-100px" })
  const galleryInView = useInView(galleryRef, { once: true, margin: "-100px" })
  const bookingInView = useInView(bookingRef, { once: true, margin: "-100px" })
  const blogInView = useInView(blogRef, { once: true, margin: "-100px" })
  const reviewsInView = useInView(reviewsRef, { once: true, margin: "-100px" })
  const contactsInView = useInView(contactsRef, { once: true, margin: "-100px" })

  const { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm } = useFormHandler()
  const ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY' // Replace with your Web3Forms Access Key

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/90 backdrop-blur-xl z-50 border-b border-white/10">
        <nav className="container mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <SafeIcon name="scissors" size={24} className="text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-wider text-white">BAZA</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection(servicesRef)} className="text-gray-300 hover:text-red-500 transition-colors text-sm font-medium">Услуги</button>
            <button onClick={() => scrollToSection(galleryRef)} className="text-gray-300 hover:text-red-500 transition-colors text-sm font-medium">Галерея</button>
            <button onClick={() => scrollToSection(bookingRef)} className="text-gray-300 hover:text-red-500 transition-colors text-sm font-medium">Запись</button>
            <button onClick={() => scrollToSection(blogRef)} className="text-gray-300 hover:text-red-500 transition-colors text-sm font-medium">Блог</button>
            <button onClick={() => scrollToSection(contactsRef)} className="text-gray-300 hover:text-red-500 transition-colors text-sm font-medium">Контакты</button>
          </div>

          <button 
            onClick={() => scrollToSection(bookingRef)}
            className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 items-center gap-2"
          >
            <SafeIcon name="calendar" size={16} />
            Записаться
          </button>

          <button 
            className="md:hidden w-10 h-10 flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <SafeIcon name={mobileMenuOpen ? 'x' : 'menu'} size={24} className="text-white" />
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-gray-900 border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-3">
                <button onClick={() => scrollToSection(servicesRef)} className="block w-full text-left text-gray-300 hover:text-red-500 py-2">Услуги</button>
                <button onClick={() => scrollToSection(galleryRef)} className="block w-full text-left text-gray-300 hover:text-red-500 py-2">Галерея</button>
                <button onClick={() => scrollToSection(bookingRef)} className="block w-full text-left text-gray-300 hover:text-red-500 py-2">Запись</button>
                <button onClick={() => scrollToSection(blogRef)} className="block w-full text-left text-gray-300 hover:text-red-500 py-2">Блог</button>
                <button onClick={() => scrollToSection(contactsRef)} className="block w-full text-left text-gray-300 hover:text-red-500 py-2">Контакты</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80')] bg-cover bg-center opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent z-10" />
        </div>

        <div className="relative z-20 container mx-auto max-w-7xl px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/30 rounded-full px-4 py-2 mb-6">
              <SafeIcon name="map-pin" size={16} className="text-red-500" />
              <span className="text-red-400 text-sm font-medium">Прага, Václavské náměstí 15</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-white mb-6 tracking-tighter">
              BAZA
              <span className="block text-red-600">BARBERSHOP</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto font-light">
              Премиальный мужской груминг в сердце Праги. 
              Традиции классического барберинга в современной интерпретации.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => scrollToSection(bookingRef)}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
              >
                <SafeIcon name="calendar-check" size={20} />
                Записаться онлайн
              </button>
              <button 
                onClick={() => scrollToSection(servicesRef)}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2"
              >
                <SafeIcon name="scissors" size={20} />
                Наши услуги
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-red-500">5+</div>
                <div className="text-gray-500 text-sm mt-1">Лет опыта</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-red-500">10k+</div>
                <div className="text-gray-500 text-sm mt-1">Клиентов</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-red-500">4.9</div>
                <div className="text-gray-500 text-sm mt-1">Рейтинг</div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 animate-bounce"
        >
          <SafeIcon name="chevron-down" size={24} />
        </motion.div>
      </section>

      {/* Services Section */}
      <section ref={servicesRef} className="py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-4">
              УСЛУГИ И <span className="text-red-600">ЦЕНЫ</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Профессиональный подход к каждой стрижке. Только качественные инструменты и косметика премиум-класса.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate={servicesInView ? "animate" : "initial"}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {SERVICES.map((service, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="group bg-gradient-to-br from-gray-900 to-black p-8 rounded-2xl border border-gray-800 hover:border-red-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/10"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                    <SafeIcon name={service.icon} size={28} className="text-red-500" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-bold text-red-500">{service.price}</div>
                    <div className="text-gray-500 text-sm">{service.duration}</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">{service.name}</h3>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
                <button 
                  onClick={() => {
                    setSelectedService(service.name)
                    scrollToSection(bookingRef)
                  }}
                  className="mt-6 w-full py-3 border border-gray-700 hover:border-red-600 hover:bg-red-600/10 rounded-lg text-gray-300 hover:text-red-400 transition-all flex items-center justify-center gap-2"
                >
                  <SafeIcon name="calendar-plus" size={16} />
                  Выбрать
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section ref={galleryRef} className="py-24 bg-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={galleryInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-4">
              НАШИ <span className="text-red-600">РАБОТЫ</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Каждая стрижка — это произведение искусства. Смотрите примеры наших работ.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={galleryInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {GALLERY_IMAGES.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={galleryInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: idx * 0.1 }}
                className="relative overflow-hidden rounded-xl aspect-square group cursor-pointer"
              >
                <img 
                  src={img} 
                  alt={`Barbershop work ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <SafeIcon name="instagram" size={16} />
                    @baza.barbershop
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-12 text-center">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105"
            >
              <SafeIcon name="instagram" size={20} />
              Смотреть в Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section ref={bookingRef} className="py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={bookingInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-4">
                ОНЛАЙН <span className="text-red-600">ЗАПИСЬ</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Выберите удобное время и услугу. Мы подтвердим вашу запись в течение 15 минут.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="clock" size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Режим работы</h4>
                    <p className="text-gray-400">Пн-Пт: 10:00 — 20:00<br/>Сб-Вс: 11:00 — 18:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="phone" size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Телефон</h4>
                    <p className="text-gray-400">+420 123 456 789</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="map-pin" size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Адрес</h4>
                    <p className="text-gray-400">Václavské náměstí 15, Praha 1</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={bookingInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 md:p-8"
            >
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    onSubmit={(e) => handleSubmit(e, ACCESS_KEY)}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Имя</label>
                        <input
                          type="text"
                          name="name"
                          required
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                          placeholder="Ваше имя"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Телефон</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                          placeholder="+420 XXX XXX XXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Услуга</label>
                      <select
                        name="service"
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 transition-colors"
                      >
                        <option value="">Выберите услугу</option>
                        {SERVICES.map((s) => (
                          <option key={s.name} value={s.name}>{s.name} — {s.price}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Дата</label>
                        <input
                          type="date"
                          name="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Время</label>
                        <select
                          name="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 transition-colors"
                        >
                          <option value="">Выберите время</option>
                          {timeSlots.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Комментарий</label>
                      <textarea
                        name="message"
                        rows="3"
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors resize-none"
                        placeholder="Особые пожелания..."
                      ></textarea>
                    </div>

                    {isError && (
                      <div className="text-red-500 text-sm bg-red-600/10 p-3 rounded-lg">
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Отправка...
                        </>
                      ) : (
                        <>
                          <SafeIcon name="check-circle" size={20} />
                          Подтвердить запись
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="text-center py-12"
                  >
                    <div className="bg-red-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <SafeIcon name="check" size={40} className="text-red-500" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white mb-4">
                      Запись принята!
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      Мы свяжемся с вами в ближайшее время для подтверждения. Спасибо за выбор BAZA!
                    </p>
                    <button
                      onClick={resetForm}
                      className="text-red-500 hover:text-red-400 font-semibold transition-colors"
                    >
                      Записаться ещё
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section ref={blogRef} className="py-24 bg-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={blogInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-4">
              БЛОГ <span className="text-red-600">BAZA</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Советы по уходу, тренды и секреты мужского стиля от наших экспертов.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate={blogInView ? "animate" : "initial"}
            className="grid md:grid-cols-3 gap-8"
          >
            {BLOG_POSTS.map((post, idx) => (
              <motion.article
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="group bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-gray-800 hover:border-red-600/30 transition-all duration-300"
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                    <SafeIcon name="calendar" size={14} />
                    {post.date}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <button className="text-red-500 hover:text-red-400 font-semibold text-sm flex items-center gap-1 transition-colors">
                    Читать далее
                    <SafeIcon name="arrow-right" size={14} />
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section ref={reviewsRef} className="py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={reviewsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-4">
              ОТЗЫВЫ <span className="text-red-600">КЛИЕНТОВ</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Что говорят о нас наши гости. Рейтинг 4.9 на основе 500+ отзывов.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate={reviewsInView ? "animate" : "initial"}
            className="grid md:grid-cols-3 gap-6"
          >
            {REVIEWS.map((review, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="bg-gray-900/50 backdrop-blur border border-gray-800 p-8 rounded-2xl hover:border-red-600/30 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <SafeIcon key={i} name="star" size={16} className="text-red-500 fill-red-500" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 italic">"{review.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">{review.name}</div>
                    <div className="text-gray-500 text-sm">{review.date}</div>
                  </div>
                  <div className="w-10 h-10 bg-red-600/10 rounded-full flex items-center justify-center">
                    <SafeIcon name="user" size={20} className="text-red-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contacts & Map Section */}
      <section ref={contactsRef} className="py-24 bg-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={contactsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-4">
              КОНТАКТЫ И <span className="text-red-600">КАРТА</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Мы находимся в самом центре Праги, рядом со станцией метро Můstek.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={contactsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center">
                    <SafeIcon name="map-pin" size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Адрес</h4>
                    <p className="text-gray-400">Václavské náměstí 15<br/>Praha 1, 110 00</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center">
                    <SafeIcon name="phone" size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Телефон</h4>
                    <p className="text-gray-400">+420 123 456 789</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center">
                    <SafeIcon name="mail" size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Email</h4>
                    <p className="text-gray-400">info@baza-barbershop.cz</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center">
                    <SafeIcon name="clock" size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Часы работы</h4>
                    <p className="text-gray-400">Пн-Пт: 10:00-20:00<br/>Сб-Вс: 11:00-18:00</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 p-6 rounded-2xl">
                <h4 className="text-white font-bold mb-4">Мы в соцсетях</h4>
                <div className="flex gap-3">
                  <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                    <SafeIcon name="instagram" size={22} className="text-white" />
                  </a>
                  <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                    <SafeIcon name="facebook" size={22} className="text-white" />
                  </a>
                  <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                    <SafeIcon name="youtube" size={22} className="text-white" />
                  </a>
                  <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                    <SafeIcon name="twitter" size={22} className="text-white" />
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={contactsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 h-[400px] lg:h-auto min-h-[400px]"
            >
              <CleanMap coordinates={[14.4378, 50.0755]} zoom={15} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <SafeIcon name="instagram" size={32} className="text-pink-500" />
              <div>
                <h3 className="text-2xl font-display font-bold text-white">@baza.barbershop</h3>
                <p className="text-gray-400 text-sm">15.2k подписчиков</p>
              </div>
            </div>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-500 hover:text-red-400 font-semibold flex items-center gap-2 transition-colors"
            >
              Подписаться
              <SafeIcon name="arrow-right" size={16} />
            </a>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {INSTAGRAM_POSTS.map((img, idx) => (
              <a 
                key={idx} 
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-lg group"
              >
                <img 
                  src={img} 
                  alt={`Instagram post ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <SafeIcon name="heart" size={20} className="text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12 telegram-safe-bottom">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <SafeIcon name="scissors" size={24} className="text-white" />
                </div>
                <span className="text-2xl font-display font-bold tracking-wider text-white">BAZA</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Премиальный барбершоп в центре Праги. Традиции классического барберинга с современным подходом.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Услуги</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection(servicesRef)} className="hover:text-red-500 transition-colors">Мужская стрижка</button></li>
                <li><button onClick={() => scrollToSection(servicesRef)} className="hover:text-red-500 transition-colors">Оформление бороды</button></li>
                <li><button onClick={() => scrollToSection(servicesRef)} className="hover:text-red-500 transition-colors">Королевское бритьё</button></li>
                <li><button onClick={() => scrollToSection(servicesRef)} className="hover:text-red-500 transition-colors">Камуфляж седины</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Информация</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection(bookingRef)} className="hover:text-red-500 transition-colors">Онлайн запись</button></li>
                <li><button onClick={() => scrollToSection(blogRef)} className="hover:text-red-500 transition-colors">Блог</button></li>
                <li><button onClick={() => scrollToSection(galleryRef)} className="hover:text-red-500 transition-colors">Галерея</button></li>
                <li><button onClick={() => scrollToSection(contactsRef)} className="hover:text-red-500 transition-colors">Контакты</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Контакты</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <SafeIcon name="map-pin" size={14} />
                  Václavské náměstí 15, Praha 1
                </li>
                <li className="flex items-center gap-2">
                  <SafeIcon name="phone" size={14} />
                  +420 123 456 789
                </li>
                <li className="flex items-center gap-2">
                  <SafeIcon name="mail" size={14} />
                  info@baza-barbershop.cz
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm">
              © 2024 BAZA Barbershop. All rights reserved.
            </div>
            <div className="flex gap-6 text-gray-500 text-sm">
              <a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-red-500 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default App