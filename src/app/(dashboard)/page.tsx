import Image from "next/image"
import Link from "next/link"
import { Sparkles, Library, Printer, Cpu, Gamepad2, Heart, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', overflow: 'auto' }}>
      {/* Hero Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '60px 24px',
        textAlign: 'center'
      }}>
        {/* Logo with Glow */}
        <div style={{ marginBottom: '32px', position: 'relative', display: 'inline-block' }}>
          <div style={{
            position: 'absolute',
            inset: '-40px',
            background: 'linear-gradient(to right, #a5f3fc, #e9d5ff, #fbcfe8)',
            filter: 'blur(50px)',
            opacity: 0.5,
            borderRadius: '9999px',
            zIndex: 0,
          }} />
          <Image
            src="/calebmakeslogo.png"
            alt="CalebMakes Logo"
            width={260}
            height={260}
            style={{ position: 'relative', zIndex: 1, objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(40px, 10vw, 64px)',
          fontWeight: 'bold',
          marginBottom: '12px',
          background: 'linear-gradient(to right, #06b6d4, #9333ea, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          CalebMakes
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: '24px',
          color: '#6b7280',
          marginBottom: '40px',
          fontWeight: '300'
        }}>
          Where Ideas Become Reality
        </p>

        {/* About Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #faf5ff 50%, #fdf2f8 100%)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '40px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            justifyContent: 'center'
          }}>
            <Heart style={{ width: '24px', height: '24px', color: '#ec4899' }} />
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1f2937' }}>
              Built with Love for Making
            </h2>
          </div>

          <p style={{
            color: '#4b5563',
            fontSize: '18px',
            lineHeight: '1.8',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            Hi, I'm Caleb! I love <span style={{ color: '#0891b2', fontWeight: '600' }}>3D printing</span>,
            <span style={{ color: '#9333ea', fontWeight: '600' }}> technology</span>, and
            <span style={{ color: '#db2777', fontWeight: '600' }}> creating things that bring joy</span>.
            This is my place to share designs, experiment with AI-powered model generation,
            and help you bring your ideas to life. Whether it's a cool gadget, a fun toy,
            or a practical tool — let's make something awesome together!
          </p>

          {/* Interest Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: '#ecfeff',
              border: '1px solid #a5f3fc',
              color: '#0891b2',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              <Printer style={{ width: '18px', height: '18px' }} /> 3D Printing
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              color: '#9333ea',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              <Cpu style={{ width: '18px', height: '18px' }} /> Tech & Gadgets
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: '#fdf2f8',
              border: '1px solid #fbcfe8',
              color: '#db2777',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              <Gamepad2 style={{ width: '18px', height: '18px' }} /> Fun Creations
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              <Sparkles style={{ width: '18px', height: '18px' }} /> AI-Powered
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
          marginBottom: '60px'
        }}>
          <Link href="/create">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-lg px-8 py-6 shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Creating
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/library">
            <Button
              size="lg"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6"
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
          gap: '12px',
          padding: '16px 24px',
          backgroundColor: '#f0fdf4',
          borderRadius: '16px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 8px #22c55e'
          }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontWeight: '600', color: '#15803d', fontSize: '16px', margin: 0 }}>
              Bambu Lab P1S Ready
            </p>
            <p style={{ color: '#4ade80', fontSize: '14px', margin: 0 }}>
              256 x 256 x 256 mm build volume
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
