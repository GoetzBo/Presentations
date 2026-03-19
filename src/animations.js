// Animation configuration loader and registry

export const animations = {
  text: {
    'cascade-up': {
      name: 'cascade-up',
      type: 'text',
      staggerDelay: 0.06,
      opacityDuration: 1.2,
      movementDuration: 1.4,
      initialY: 60,
      finalY: 0,
      ease: [0.34, 1.56, 0.64, 1]
    }
  }
}

export const getAnimation = (type, name) => {
  return animations[type]?.[name] || animations.text['cascade-up'] // Default fallback
}

export default animations
