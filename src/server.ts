import Fastify from 'fastify'
import { prisma } from './lib/prisma.js'
import cors from '@fastify/cors'

interface CreateTaskBody {
  title: string
  description?: string
}

interface UpdateTaskBody {
  title?: string
  description?: string
  completed?: boolean
}

interface TaskParams {
  id: string
}

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
})

app.get('/health', async () => {
  return {
    status: 'ok',
    message: 'TaskFlow API is running',
  }
})

app.get('/db-health', async () => {
  await prisma.$queryRaw`SELECT 1`

  return {
    status: 'ok',
    message: 'Database connection is working',
  }
})

// List tasks
app.get('/tasks', async () => {
  return prisma.task.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
})

// Create a task
app.post<{ Body: CreateTaskBody }>('/tasks', async (request, reply) => {
  const title = request.body.title?.trim()

  if (!title) {
    return reply.code(400).send({
      message: 'Title is required',
    })
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: request.body.description?.trim() ?? '',
    },
  })

  return reply.code(201).send(task)
})

// Update a task
app.patch<{ Params: TaskParams; Body: UpdateTaskBody }>(
  '/tasks/:id',
  async (request, reply) => {
    const id = Number(request.params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return reply.code(400).send({
        message: 'Invalid task ID',
      })
    }

    const body = request.body

    if (
      body.title === undefined &&
      body.description === undefined &&
      body.completed === undefined
    ) {
      return reply.code(400).send({
        message: 'At least one field must be provided',
      })
    }

    if (body.title !== undefined && !body.title.trim()) {
      return reply.code(400).send({
        message: 'Title cannot be empty',
      })
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return reply.code(404).send({
        message: 'Task not found',
      })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined && {
          title: body.title.trim(),
        }),
        ...(body.description !== undefined && {
          description: body.description.trim(),
        }),
        ...(body.completed !== undefined && {
          completed: body.completed,
        }),
      },
    })

    return task
  },
)

// Delete a task
app.delete<{ Params: TaskParams }>('/tasks/:id', async (request, reply) => {
  const id = Number(request.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return reply.code(400).send({
      message: 'Invalid task ID',
    })
  }

  const existingTask = await prisma.task.findUnique({
    where: { id },
  })

  if (!existingTask) {
    return reply.code(404).send({
      message: 'Task not found',
    })
  }

  await prisma.task.delete({
    where: { id },
  })

  return reply.code(204).send()
})

async function start() {
  try {
    await app.listen({
      port: 3333,
      host: '0.0.0.0',
    })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()
