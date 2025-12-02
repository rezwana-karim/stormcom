/**
 * Accept/Decline Staff Invitation API
 * 
 * POST /api/stores/[id]/staff/accept-invite - Accept staff invitation
 * DELETE /api/stores/[id]/staff/accept-invite - Decline invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendStaffAcceptedEmail } from '@/lib/email-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/stores/[id]/staff/accept-invite
 * Accept a staff invitation
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: storeId } = await context.params;
    
    // Find pending invitation for this user
    const invitation = await prisma.storeStaff.findFirst({
      where: {
        userId: session.user.id,
        storeId,
        isActive: true,
        acceptedAt: null,
      },
      include: {
        store: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true } },
      },
    });
    
    if (!invitation) {
      return NextResponse.json({ error: 'No pending invitation found' }, { status: 404 });
    }
    
    // Accept the invitation
    const acceptedStaff = await prisma.storeStaff.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
      include: {
        store: { select: { name: true } },
        customRole: { select: { name: true } },
      },
    });
    
    const roleName = invitation.customRole?.name || invitation.role || 'staff';
    
    // Notify the store owner
    const ownerMembership = await prisma.membership.findFirst({
      where: {
        role: 'OWNER',
        organization: { store: { id: storeId } },
      },
      select: { 
        userId: true,
        user: { select: { name: true, email: true } },
      },
    });
    
    if (ownerMembership) {
      await prisma.notification.create({
        data: {
          userId: ownerMembership.userId,
          type: 'STAFF_JOINED',
          title: 'Invitation Accepted',
          message: `${session.user.name || session.user.email} has accepted the invitation to join "${acceptedStaff.store.name}" as ${roleName}.`,
        },
      });
      
      // Send email notification to owner (non-blocking)
      if (ownerMembership.user.email) {
        sendStaffAcceptedEmail(
          ownerMembership.user.email,
          ownerMembership.user.name || 'Store Owner',
          session.user.name || session.user.email || 'New Staff',
          acceptedStaff.store.name,
          roleName
        ).catch(err => console.error('Failed to send staff accepted email:', err));
      }
    }
    
    // Log activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        storeId,
        action: 'STAFF_JOINED',
        entityType: 'StoreStaff',
        entityId: invitation.id,
        description: `Joined "${acceptedStaff.store.name}" as ${roleName}`,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Invitation accepted',
      staff: {
        id: acceptedStaff.id,
        store: acceptedStaff.store,
        role: acceptedStaff.role,
        customRole: acceptedStaff.customRole,
        acceptedAt: acceptedStaff.acceptedAt,
      },
    });
    
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}

/**
 * DELETE /api/stores/[id]/staff/accept-invite
 * Decline a staff invitation
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: storeId } = await context.params;
    
    // Find pending invitation
    const invitation = await prisma.storeStaff.findFirst({
      where: {
        userId: session.user.id,
        storeId,
        isActive: true,
        acceptedAt: null,
      },
      include: {
        store: { select: { name: true } },
      },
    });
    
    if (!invitation) {
      return NextResponse.json({ error: 'No pending invitation found' }, { status: 404 });
    }
    
    // Delete the invitation
    await prisma.storeStaff.delete({
      where: { id: invitation.id },
    });
    
    // Notify the store owner
    const ownerMembership = await prisma.membership.findFirst({
      where: {
        role: 'OWNER',
        organization: { store: { id: storeId } },
      },
      select: { userId: true },
    });
    
    if (ownerMembership) {
      await prisma.notification.create({
        data: {
          userId: ownerMembership.userId,
          type: 'STAFF_DECLINED',
          title: 'Invitation Declined',
          message: `${session.user.name || session.user.email} has declined the invitation to join "${invitation.store.name}".`,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invitation declined',
    });
    
  } catch (error) {
    console.error('Decline invitation error:', error);
    return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
  }
}
