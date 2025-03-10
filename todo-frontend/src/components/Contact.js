import React, { useState, useEffect } from 'react'
import '../styles/Contact.css' // Import styles

const images = [
  require('../assets/slideshowImages/slideshowImage1.jpg'),
  require('../assets/slideshowImages/slideshowImage2.png'),
  require('../assets/slideshowImages/slideshowImage3.jpg'),
  require('../assets/slideshowImages/slideshowImage4.jpeg'),
  require('../assets/slideshowImages/slideshowImage5.png'),
  require('../assets/slideshowImages/slideshowImage6.jpg'),
  require('../assets/slideshowImages/slideshowImage7.png'),
  require('../assets/slideshowImages/slideshowImage8.jpg'),
  require('../assets/slideshowImages/slideshowImage9.jpeg'),
  require('../assets/slideshowImages/slideshowImage10.png'),
  require('../assets/slideshowImages/slideshowImage11.jpg'),
  require('../assets/slideshowImages/slideshowImage12.png'),
  require('../assets/slideshowImages/slideshowImage13.jpg'),
  require('../assets/slideshowImages/slideshowImage14.jpeg'),
  require('../assets/slideshowImages/slideshowImage15.jpg'),
  require('../assets/slideshowImages/slideshowImage16.png'),
  require('../assets/slideshowImages/slideshowImage17.jpg')
]

const Contact = () => {
  // State for form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  // Slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Handle form input change
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Handle form submission
  const handleSubmit = e => {
    e.preventDefault()
    alert(`Message Sent!\nName: ${formData.name}\nEmail: ${formData.email}`)
    setFormData({ name: '', email: '', message: '' }) // Reset form
  }

  // Auto slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length)
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval) // Cleanup interval on unmount
  }, [])

  return (
    <div className='contact-container'>
      {/* Left Panel - Form */}
      <div className='contact-form'>
        <h2>Get in Touch</h2>
        <p>
          Feel free to drop a message! I'll get back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit}>
          <div className='input-group'>
            <input
              type='text'
              name='name'
              placeholder='Your Name'
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className='input-group'>
            <input
              type='email'
              name='email'
              placeholder='Your Email'
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className='input-group'>
            <textarea
              name='message'
              placeholder='Your Message'
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>
          <button type='submit'>Send Message</button>
        </form>
      </div>

      {/* Right Panel - Slideshow */}
      <div className='contact-slideshow'>
        <img src={images[currentImageIndex]} alt='Slideshow' />
      </div>
    </div>
  )
}

export default Contact
