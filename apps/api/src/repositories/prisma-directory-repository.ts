import type { Directory, Prisma } from "@prisma/client";
import type { DirectoryRepository } from "./directory-repository";

import { prisma } from "@/lib/prisma";

export class PrismaDirectoryRepository implements DirectoryRepository {
  
  async moveDir(directory: Directory): Promise<void> {
    await prisma.directory.update({
      data: {
        parentId: directory.parentId
      },
      where: {
        id: directory.id
      },
    });
  }
  
  async getByAuthor(authorId: string): Promise<Directory[]> {
  
    return prisma.directory.findMany({      
      include: {
        //childrens: true,
        notes: true
      },
      where: {
        authorId,
        // parentId: null
      },
    })
  
  }
  async renameDir(newName: string, id: number): Promise<void> {    
    await prisma.directory.update({
      data: {
        title: newName
      },
      where: {
        id,
      },
    });
  }
  async delete(id: number): Promise<void> {
    await prisma.directory.delete({
      where: {
        id,
      }
    })
  }
  async findById(id: number): Promise<Directory | null>{
    return await prisma.directory.findFirst({
      where: {
        id,
      },
    });
  };
  
  async create(data: Prisma.DirectoryCreateInput): Promise<Directory> {
    return await prisma.directory.create({
      data
    });
  };
  
}