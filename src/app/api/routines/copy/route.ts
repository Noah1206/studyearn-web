import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RoutineItem {
  id: string;
  day: number;
  startHour?: number;
  endHour?: number;
  title: string;
  color: string;
}

interface CopyRoutineRequest {
  productId: string;
  title: string;
  routineType: string;
  routineDays?: number;
  routineItems: RoutineItem[];
}

/**
 * Normalize routine type to match database constraint
 * The routines table only accepts: 'day', 'week', 'month', 'custom'
 */
function normalizeRoutineType(type: string): string {
  const normalizedType = type.toLowerCase();
  switch (normalizedType) {
    case 'daily':
    case 'day':
      return 'day';
    case 'weekly':
    case 'week':
      return 'week';
    case 'monthly':
    case 'month':
      return 'month';
    case 'custom':
      return 'custom';
    default:
      return 'week'; // default fallback
  }
}

/**
 * POST /api/routines/copy
 * Copy a routine from a product to the current user's routines
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CopyRoutineRequest = await request.json();
    const { productId, title, routineType, routineDays, routineItems } = body;

    // Validate required fields
    if (!productId || !title || !routineType || !routineItems) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the product exists and is a routine
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, content_type, price, user_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.content_type !== 'routine') {
      return NextResponse.json(
        { error: 'Product is not a routine' },
        { status: 400 }
      );
    }

    // Check if user owns the product or has purchased it (for paid products)
    const isOwner = product.user_id === user.id;

    if (!isOwner && product.price > 0) {
      // Check if user has purchased this product
      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .single();

      if (!purchase) {
        return NextResponse.json(
          { error: 'Purchase required to copy this routine' },
          { status: 403 }
        );
      }
    }

    // Generate new IDs for routine items to avoid conflicts
    const newRoutineItems = routineItems.map((item, index) => ({
      ...item,
      id: `item_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`,
    }));

    // Normalize routine type to match database constraint
    // The routines table CHECK constraint only allows: 'day', 'week', 'month', 'custom'
    const normalizedRoutineType = normalizeRoutineType(routineType);

    // Create the copied routine
    const { data: newRoutine, error: insertError } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        title: title,
        routine_type: normalizedRoutineType,
        routine_days: routineDays || null,
        routine_items: newRoutineItems,
        is_public: false, // Copied routines start as private
      })
      .select('id, title, routine_type, routine_days, routine_items, is_public, created_at')
      .single();

    if (insertError) {
      console.error('Error copying routine:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        originalRoutineType: routineType,
        normalizedRoutineType,
      });
      return NextResponse.json(
        {
          error: 'Failed to copy routine',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      routine: newRoutine,
      message: 'Routine copied successfully',
    });

  } catch (error) {
    console.error('Copy routine error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
