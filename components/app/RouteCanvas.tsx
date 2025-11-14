'use client'

import { useEffect, useRef } from 'react'
import { decodePolyline } from '@/lib/polyline'

interface RouteCanvasProps {
  activity: any
  template: string | null
  club: string | null
}

export function RouteCanvas({ activity, template, club }: RouteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!canvasRef.current || !activity) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size (9:16 aspect ratio)
    const width = 1080
    const height = 1920
    canvas.width = width
    canvas.height = height

    // Calculate display size to fit container
    const container = canvas.parentElement
    if (container) {
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const aspect = width / height
      
      let displayWidth = containerWidth
      let displayHeight = displayWidth / aspect
      
      if (displayHeight > containerHeight) {
        displayHeight = containerHeight
        displayWidth = displayHeight * aspect
      }
      
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
    }

    const render = () => {
      if (!ctx) return

      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Draw background
      if (activity.map?.summary_polyline) {
        try {
          const decoded = decodePolyline(activity.map.summary_polyline)
          
          if (decoded.length > 0) {
            // Calculate bounds
            let minLat = decoded[0][0]
            let maxLat = decoded[0][0]
            let minLng = decoded[0][1]
            let maxLng = decoded[0][1]
            
            decoded.forEach(([lat, lng]) => {
              minLat = Math.min(minLat, lat)
              maxLat = Math.max(maxLat, lat)
              minLng = Math.min(minLng, lng)
              maxLng = Math.max(maxLng, lng)
            })
            
            const latRange = maxLat - minLat
            const lngRange = maxLng - minLng
            const padding = 0.1
            
            // Draw route
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 4
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            
            ctx.beginPath()
            decoded.forEach(([lat, lng], index) => {
              const x = ((lng - minLng) / lngRange) * width * (1 - padding * 2) + width * padding
              const y = ((maxLat - lat) / latRange) * height * (1 - padding * 2) + height * padding
              
              if (index === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            })
            ctx.stroke()
          }
        } catch (error) {
          console.error('Failed to decode polyline:', error)
        }
      }

      // Draw stats overlay
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 32px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      
      const stats = [
        { label: 'DISTANCE', value: `${(activity.distance / 1000).toFixed(2)} km` },
        { label: 'ELEVATION', value: `${activity.total_elevation_gain} m` },
        { label: 'AVG SPEED', value: `${(activity.average_speed * 3.6).toFixed(1)} km/h` },
        { label: 'TIME', value: `${Math.floor(activity.moving_time / 3600)}h ${Math.floor((activity.moving_time % 3600) / 60)}m` },
      ]

      let y = 50
      stats.forEach((stat, index) => {
        if (index < 2) {
          // Top stats
          ctx.fillStyle = '#FFFFFF'
          ctx.font = '12px Inter, sans-serif'
          ctx.fillText(stat.label, 50, y)
          ctx.font = 'bold 24px Inter, sans-serif'
          ctx.fillText(stat.value, 50, y + 20)
          y += 80
        }
      })

      // Bottom stats
      y = height - 100
      stats.slice(2).forEach((stat) => {
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '12px Inter, sans-serif'
        ctx.fillText(stat.label, 50, y)
        ctx.font = 'bold 24px Inter, sans-serif'
        ctx.fillText(stat.value, 50, y + 20)
        y += 80
      })
    }

    render()
    
    // Handle resize
    const handleResize = () => {
      if (renderRef.current) {
        cancelAnimationFrame(renderRef.current)
      }
      renderRef.current = requestAnimationFrame(render)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (renderRef.current) {
        cancelAnimationFrame(renderRef.current)
      }
    }
  }, [activity, template, club])

  return (
    <canvas
      ref={canvasRef}
      id="route-canvas"
      className="max-w-full max-h-full"
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}

