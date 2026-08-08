import { prisma } from '../../config/database';
import { NotFoundError, ConflictError } from '../../utils/errors';
import bcrypt from 'bcrypt';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(6).optional(),
});

export class UserService {
  async findAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async create(data: z.infer<typeof createUserSchema>, createdById: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('User with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: data.role, status: data.status },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: { userId: createdById, action: 'USER_CREATED', entityType: 'USER', entityId: user.id, newValues: { name: user.name, email: user.email, role: user.role } as any },
    });

    return user;
  }

  async update(id: string, data: z.infer<typeof updateUserSchema>, updatedById: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User', id);

    const updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, updatedAt: true },
    });

    await prisma.auditLog.create({
      data: { userId: updatedById, action: 'USER_UPDATED', entityType: 'USER', entityId: id,
        oldValues: { name: existing.name, role: existing.role, status: existing.status } as any,
        newValues: { name: user.name, role: user.role, status: user.status } as any },
    });

    return user;
  }
}

export const userService = new UserService();
