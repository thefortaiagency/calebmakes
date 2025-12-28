import Image from "next/image"
import Link from "next/link"
import { Sparkles, Library, Printer, Cpu, Gamepad2, Heart, ArrowRight, Home, FolderHeart, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 16px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          {/* Logo */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
          }}>
            <Image
              src="/calebmakeslogo.png"
              alt="CalebMakes"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <span style={{
              fontWeight: 'bold',
              fontSize: '18px',
              background: 'linear-gradient(to right, #06b6d4, #9333ea)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              CalebMakes
            </span>
          </Link>

          {/* Nav Links - Hidden on very small screens */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Link href="/create" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}>
              <Sparkles style={{ width: '16px', height: '16px' }} />
              <span className="hidden sm:inline">Create</span>
            </Link>
            <Link href="/library" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <Library style={{ width: '16px', height: '16px' }} />
              <span className="hidden sm:inline">Library</span>
            </Link>
            <Link href="/my-models" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <FolderHeart style={{ width: '16px', height: '16px' }} />
              <span className="hidden sm:inline">My Models</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px 60px',
        textAlign: 'center'
      }}>
        {/* Logo with Glow */}
        <div style={{
          marginBottom: '24px',
          position: 'relative',
          display: 'inline-block'
        }}>
          <div style={{
            position: 'absolute',
            inset: '-30px',
            background: 'linear-gradient(to right, #a5f3fc, #e9d5ff, #fbcfe8)',
            filter: 'blur(40px)',
            opacity: 0.5,
            borderRadius: '9999px',
            zIndex: 0,
          }} />
          <Image
            src="/calebmakeslogo.png"
            alt="CalebMakes Logo"
            width={200}
            height={200}
            style={{
              position: 'relative',
              zIndex: 1,
              objectFit: 'contain',
              maxWidth: '60vw',
              height: 'auto'
            }}
            priority
          />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(32px, 10vw, 56px)',
          fontWeight: 'bold',
          marginBottom: '8px',
          background: 'linear-gradient(to right, #06b6d4, #9333ea, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1
        }}>
          CalebMakes
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(18px, 5vw, 24px)',
          color: '#6b7280',
          marginBottom: '32px',
          fontWeight: '300'
        }}>
          Where Ideas Become Reality
        </p>

        {/* About Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #faf5ff 50%, #fdf2f8 100%)',
          borderRadius: '20px',
          padding: 'clamp(20px, 5vw, 32px)',
          marginBottom: '32px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Heart style={{ width: '22px', height: '22px', color: '#ec4899', flexShrink: 0 }} />
            <h2 style={{
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Built with Love for Making
            </h2>
          </div>

          <p style={{
            color: '#4b5563',
            fontSize: 'clamp(15px, 3.5vw, 18px)',
            lineHeight: '1.7',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Hi, I'm Caleb! I love <span style={{ color: '#0891b2', fontWeight: '600' }}>3D printing</span>,
            <span style={{ color: '#9333ea', fontWeight: '600' }}> technology</span>, and
            <span style={{ color: '#db2777', fontWeight: '600' }}> creating things that bring joy</span>.
            This is my place to share designs, experiment with AI-powered model generation,
            and help you bring your ideas to life!
          </p>

          {/* Interest Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '9999px',
              backgroundColor: '#ecfeff',
              border: '1px solid #a5f3fc',
              color: '#0891b2',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              <Printer style={{ width: '14px', height: '14px' }} /> 3D Printing
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '9999px',
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              color: '#9333ea',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              <Cpu style={{ width: '14px', height: '14px' }} /> Tech
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '9999px',
              backgroundColor: '#fdf2f8',
              border: '1px solid #fbcfe8',
              color: '#db2777',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              <Gamepad2 style={{ width: '14px', height: '14px' }} /> Fun
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '9999px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              <Sparkles style={{ width: '14px', height: '14px' }} /> AI
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <Link href="/create" style={{ width: '100%', maxWidth: '300px' }}>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-base sm:text-lg px-6 py-5 shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Creating
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/library" style={{ width: '100%', maxWidth: '300px' }}>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-base sm:text-lg px-6 py-5"
            >
              <Library className="w-5 h-5 mr-2" />
              Browse Models
            </Button>
          </Link>
        </div>

        {/* Printer Info */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 20px',
          backgroundColor: '#f0fdf4',
          borderRadius: '14px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
            flexShrink: 0
          }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontWeight: '600',
              color: '#15803d',
              fontSize: '14px',
              margin: 0
            }}>
              Bambu Lab P1S Ready
            </p>
            <p style={{
              color: '#4ade80',
              fontSize: '12px',
              margin: 0
            }}>
              256 x 256 x 256 mm
            </p>
          </div>
        </div>

        {/* Spacer for mobile nav */}
        <div style={{ height: '80px' }} />
      </div>
    </div>
  )
}
