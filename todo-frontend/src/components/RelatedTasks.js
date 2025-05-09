import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// import { Link } from 'react-router-dom'
import RelatedTaskForm from './RelatedTaskForm'
import RelatedTaskItem from './RelatedTaskItem'
import Notification from './Notification'
import Modal from './Modal'
import ConfirmDeleteModal from './ConfirmDeleteModal'

const RelatedTasks = ({ tasks = [] }) => {
  const [relatedTasks, setRelatedTasks] = useState([])
  const [showForm, setShowForm] = useState(false) // Toggle form visibility
  const { taskId } = useParams() // Get the parent taskId from the URL
  const [parentTitle, setParentTitle] = useState('Loading...')
  const [notification, setNotification] = useState(null) // Notification state
  const token = localStorage.getItem('authToken') // Get the token from localStorage
  const [editingTask, setEditingTask] = useState(null)
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)

  useEffect(() => {
    let allTasks = tasks || []

    // Ensure initial loading state is handled
    if (!allTasks || allTasks.length === 0) {
      // Fetch the parent task and related tasks
      fetch(`http://localhost:5000/api/related-tasks/${taskId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}` // Pass the token for authentication
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.parentTitle) {
            setParentTitle(data.parentTitle) // Set parent task title
          } else {
            setParentTitle('Unknown Task') // Default title if not found
          }

          // Ensure relatedTasks is always an array before setting state
          setRelatedTasks(data.relatedTasks || []) // Default to empty array if no tasks
        })
        .catch(() => {
          setParentTitle('Failed to load task') // Error handling for failed fetch
          setRelatedTasks([]) // Ensure no related tasks if error occurs
        })
    } else {
      // If tasks are already available, find the title from the list
      const found = allTasks.find(task => task._id === taskId)
      if (found) {
        setParentTitle(found.title) // Set title based on found task
        setRelatedTasks(found.relatedTasks || []) // Set related tasks if available
      } else {
        setParentTitle('Unknown Task') // Default if task not found
        setRelatedTasks([]) // No related tasks if task is not found
      }
    }
  }, [taskId, tasks, token]) // Depend on taskId, tasks, and token

  // Fetch related tasks when the component loads
  useEffect(() => {
    const fetchRelatedTasks = async () => {
      if (!taskId) {
        console.warn('taskId is undefined, skipping fetch')
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          console.error('No auth token found in localStorage!')
          return
        }

        console.log('Fetching related tasks for:', taskId)

        const response = await fetch(
          `http://localhost:5000/api/related-tasks/${taskId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` // Authorization token
            }
          }
        )
        const data = await response.json()
        console.log('Fetched related tasks:', data)

        if (data && Array.isArray(data.relatedTasks)) {
          setRelatedTasks(data.relatedTasks) // Update only the related tasks array
        } else {
          console.error('Fetched data is not an array:', data) // Log error if data format is wrong
        }
      } catch (error) {
        console.error('Error fetching related tasks:', error)
      }
    }
    fetchRelatedTasks()
  }, [taskId]) // Only depend on taskId, since this fetch is based on it

  // Function to show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000) // Hide after 3 seconds
  }

  // Handle new related task creation
  const handleAddTask = async newTaskData => {
    console.log('Attempting to add task:', newTaskData) // Check the task data

    if (!newTaskData.title.trim()) {
      console.error('Invalid Task Data')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found in localStorage!')
        return
      }

      const response = await fetch(
        `http://localhost:5000/api/related-tasks/${taskId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` // Authorization token
          },
          body: JSON.stringify(newTaskData)
        }
      )
      const data = await response.json()
      console.log('Server Response:', data)

      if (data.relatedTask) {
        setRelatedTasks(prevTasks => [...prevTasks, data.relatedTask])

        setShowForm(false)
        showNotification('Task added successfully!', 'success')
        return data.relatedTask // Return the newly added task
      }
    } catch (error) {
      console.error('Error adding related task:', error)
      showNotification('Failed to add task.', 'error')

      return null
    }
  }

  const handleEditModalOpen = task => {
    setEditingTask(task)
  }

  const handleEditModalClose = () => {
    setEditingTask(null)
  }

  // Handle task update (could be a modal or form to edit the title)
  const handleUpdateTask = async (relatedTaskId, updatedData) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found in localStorage!')
        return
      }

      const response = await fetch(
        `http://localhost:5000/api/related-tasks/${taskId}/${relatedTaskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` // Moved inside headers
          },
          body: JSON.stringify(updatedData)
        }
      )

      const data = await response.json()
      setRelatedTasks(
        relatedTasks.map(task =>
          task._id === relatedTaskId ? data.relatedTask : task
        )
      )
      showNotification('Task updated successfully!', 'success')
    } catch (error) {
      console.error('Error updating related task:', error)
      showNotification('Failed to update task.', 'error')
    }
  }

  const handleDeleteClick = taskId => {
    setTaskToDelete(taskId)
    setShowDeleteModal(true)
  }

  // Handle task deletion
  const handleDeleteTask = async () => {
    try {
      const token = localStorage.getItem('authToken')
      console.log(
        `Deleting related task ${taskToDelete} for parent task ${taskId}`
      )

      const response = await fetch(
        `http://localhost:5000/api/related-tasks/${taskId}/${taskToDelete}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        setRelatedTasks(prev => prev.filter(task => task._id !== taskToDelete))
        showNotification('Task deleted successfully!', 'success')
      } else {
        console.error('Failed to delete related task')
        showNotification('Failed to delete task.', 'error')
      }
    } catch (error) {
      console.error('Error deleting related task:', error)
      showNotification('Failed to delete task.', 'error')
    } finally {
      setShowDeleteModal(false)
      setTaskToDelete(null)
    }
  }

  const handleFavoriteTask = async (task, isNowFavorite) => {
    try {
      const method = isNowFavorite ? 'PUT' : 'DELETE'
      const token = localStorage.getItem('authToken')

      const response = await fetch(
        `http://localhost:5000/api/tasks/${task._id}/favorite`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok)
        throw new Error(data.message || 'Favorite toggle failed')

      // Update the task in local state
      setRelatedTasks(prev =>
        prev.map(t =>
          t._id === task._id ? { ...t, favorite: isNowFavorite } : t
        )
      )

      showNotification(
        isNowFavorite
          ? 'Task added to favorites!'
          : 'Task removed from favorites!',
        'success'
      )
    } catch (error) {
      console.error('Error toggling favorite:', error)
      showNotification('Favorite toggle failed', 'error')
    }
  }

  return (
    <div className='related-tasks-container'>
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}

      {parentTitle === 'Loading...' || !parentTitle ? (
        <p>Loading parent task info...</p> // Show loading message until the title is fetched
      ) : (
        <h2 className='related-heading'>Related Tasks for: “{parentTitle}”</h2>
      )}

      {/* Toggle Button */}
      <button
        className='toggle-form-btn'
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Hide Form' : 'Add Related Task'}
      </button>

      {/* Show Form if Open */}
      {showForm && (
        <RelatedTaskForm onAdd={handleAddTask} parentTaskId={taskId} />
      )}

      <ul className='task-list'>
        {relatedTasks.length > 0 ? (
          relatedTasks.map(task => (
            <RelatedTaskItem
              key={task._id}
              task={task}
              onDelete={handleDeleteClick}
              onEdit={handleEditModalOpen}
              isFavorite={task.isFavorite} // ← coming from backend
              onFavorite={handleFavoriteTask} // Assuming this function exists in your component
            />
          ))
        ) : (
          <p>No related tasks available</p>
        )}
      </ul>
      {editingTask && (
        <Modal
          task={editingTask}
          onClose={handleEditModalClose}
          onSave={updatedTaskData =>
            handleUpdateTask(editingTask._id, updatedTaskData)
          }
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          message='Are you sure you want to delete this related task?'
          onConfirm={handleDeleteTask}
          onCancel={() => {
            setShowDeleteModal(false)
            setTaskToDelete(null)
          }}
        />
      )}
    </div>
  )
}

export default RelatedTasks
