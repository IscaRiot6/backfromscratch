import express from 'express'
import Task from '../models/taskModel.js'
import User from '../models/userModel.js' // ✅ Include User model
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// ✅ Protect all routes with authentication
router.use(authMiddleware)

// ✅ Get related tasks (GET)
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params

  try {
    console.log('Fetching related tasks for task:', taskId)
    const task = await Task.findOne({
      _id: taskId,
      user: req.user.userId
    }).populate('relatedTasks')

    if (!task)
      return res.status(404).json({ error: 'Task not found or unauthorized' })

    const user = await User.findById(req.user.userId)

    // Convert favoriteTasks to string IDs for easier comparison
    const favoriteTaskIds = user.favoriteTasks.map(id => id.toString())

    // Map over relatedTasks and add `isFavorite` flag
    const relatedTasksWithFavorites = task.relatedTasks.map(related => {
      const taskObj = related.toObject()
      taskObj.isFavorite = favoriteTaskIds.includes(related._id.toString())
      return taskObj
    })

    res.json({
      parentTitle: task.title,
      relatedTasks: relatedTasksWithFavorites
    })
  } catch (error) {
    console.error('Error fetching related tasks:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// ✅ Add a related task (POST)
router.post('/:taskId', async (req, res) => {
  const { taskId } = req.params
  const { title, description, image, image2, genres, themes, yourScore } =
    req.body

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required' })
  }

  try {
    console.log('Adding related task to taskId:', taskId)

    const task = await Task.findOne({ _id: taskId, user: req.user.userId })
    if (!task)
      return res.status(404).json({ error: 'Task not found or unauthorized' })

    // Ensure the logged-in user exists
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // ✅ Create a related task with a parentTaskId
    const newRelatedTask = new Task({
      title,
      description,
      image,
      image2,
      genres,
      themes,
      yourScore,
      user: req.user.userId,
      parentTaskId: taskId // ✅ Set parentTaskId to prevent it from appearing in home page
    })

    const savedTask = await newRelatedTask.save()

    console.log('Saved related task:', savedTask)

    // ✅ Store the related task reference in the parent task
    task.relatedTasks.push(savedTask._id)
    await task.save()

    // ✅ Store the related task in the user's profile (optional)
    user.tasks.push(savedTask._id)

    // Add history entry for the new task
    user.history.push({
      action: 'Created Related Task',
      taskId: savedTask._id,
      taskTitle: savedTask.title,
      parentTaskId: taskId, // optional
      type: 'related', // optional
      timestamp: new Date()
    })

    await user.save()

    // ✅ Return the updated parent task with its related tasks
    const updatedTask = await Task.findById(taskId).populate('relatedTasks')

    res.status(201).json({
      message: 'Related task created',
      relatedTask: savedTask,
      parentTask: updatedTask
    })
  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// ✅ Update a related task (PUT)
router.put('/:taskId/:relatedId', async (req, res) => {
  const { taskId, relatedId } = req.params
  const { title, description, image, image2, genres, themes, yourScore } =
    req.body

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required' })
  }

  try {
    // Step 1: Find the parent task
    const task = await Task.findOne({ _id: taskId, user: req.user.userId })
    if (!task)
      return res
        .status(404)
        .json({ error: 'Parent task not found or unauthorized' })

    // Step 2: Find the related task to update
    const relatedTask = await Task.findOne({
      _id: relatedId,
      user: req.user.userId
    }).populate('parentTaskId')
    if (!relatedTask)
      return res
        .status(404)
        .json({ error: 'Related task not found or unauthorized' })

    // Step 3: Update the related task fields
    relatedTask.title = title
    relatedTask.description = description || relatedTask.description
    relatedTask.image = image || relatedTask.image
    relatedTask.image2 = image2 || relatedTask.image2
    relatedTask.genres = genres || relatedTask.genres
    relatedTask.themes = themes || relatedTask.themes
    relatedTask.yourScore = yourScore || relatedTask.yourScore

    const updatedTask = await relatedTask.save()

    // ✅ Push to user history
    const user = await User.findById(req.user.userId)
    user.history.push({
      action: 'Updated Related Task',
      taskId: updatedTask._id,
      taskTitle: updatedTask.title,
      parentTask: {
        id: task._id,
        title: task.title
      },
      type: 'related',
      timestamp: new Date()
    })
    await user.save()

    res.status(200).json({
      message: 'Related task updated successfully',
      relatedTask: updatedTask
    })
  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// ✅ Delete a related task (DELETE)
router.delete('/:taskId/:relatedId', async (req, res) => {
  const { taskId, relatedId } = req.params

  try {
    const task = await Task.findOne({ _id: taskId, user: req.user.userId })
    if (!task)
      return res.status(404).json({ error: 'Task not found or unauthorized' })

    // ✅ Remove reference
    task.relatedTasks = task.relatedTasks.filter(
      id => id.toString() !== relatedId
    )
    await task.save()

    // ✅ Delete the related task itself
    const deletedTask = await Task.findOneAndDelete({
      _id: relatedId,
      user: req.user.userId
    })
    if (!deletedTask)
      return res.status(404).json({ error: 'Related task not found' })

    // ✅ Remove from user's tasks
    const user = await User.findById(req.user.userId)
    user.history.push({
      action: 'Deleted Related Task',
      taskId: deletedTask._id,
      taskTitle: deletedTask.title,
      parentTask: {
        id: task._id,
        title: task.title
      },
      type: 'related',
      timestamp: new Date()
    })
    await user.save()

    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { tasks: relatedId }
    })

    res.json({ message: 'Related task deleted' })
  } catch (error) {
    console.error('Error deleting related task:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET a specific related task by ID
router.get('/related/:relatedId', authMiddleware, async (req, res) => {
  const { relatedId } = req.params

  try {
    const task = await Task.findOne({
      _id: relatedId,
      user: req.user.userId
    })

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' })
    }

    res.json(task)
  } catch (error) {
    console.error('Error fetching individual related task:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
