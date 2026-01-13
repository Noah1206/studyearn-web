import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BankCode } from '@/lib/deeplink';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/me/payment-accounts/[id]
 * 특정 결제 계좌 조회
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: account, error: fetchError } = await supabase
      .from('user_payment_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        { success: false, error: '계좌를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const formattedAccount = {
      id: account.id,
      userId: account.user_id,
      bankCode: account.bank_code as BankCode,
      bankName: account.bank_name,
      accountNumber: account.account_number,
      accountHolder: account.account_holder,
      supportsDeeplink: account.supports_deeplink,
      isPrimary: account.is_primary,
      isVerified: account.is_verified,
      nickname: account.nickname,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: formattedAccount,
    });
  } catch (error) {
    console.error('Payment account fetch API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/me/payment-accounts/[id]
 * 결제 계좌 정보 수정 (별명, 기본계좌 설정)
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, isPrimary } = body;

    // 계좌 존재 및 소유권 확인
    const { data: existingAccount, error: fetchError } = await supabase
      .from('user_payment_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAccount) {
      return NextResponse.json(
        { success: false, error: '계좌를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {};
    if (nickname !== undefined) {
      updateFields.nickname = nickname;
    }
    if (isPrimary !== undefined) {
      updateFields.is_primary = isPrimary;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // 계좌 정보 업데이트
    const { data: updatedAccount, error: updateError } = await supabase
      .from('user_payment_accounts')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Payment account update error:', updateError);
      return NextResponse.json(
        { success: false, error: '계좌 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    const formattedAccount = {
      id: updatedAccount.id,
      userId: updatedAccount.user_id,
      bankCode: updatedAccount.bank_code as BankCode,
      bankName: updatedAccount.bank_name,
      accountNumber: updatedAccount.account_number,
      accountHolder: updatedAccount.account_holder,
      supportsDeeplink: updatedAccount.supports_deeplink,
      isPrimary: updatedAccount.is_primary,
      isVerified: updatedAccount.is_verified,
      nickname: updatedAccount.nickname,
      createdAt: updatedAccount.created_at,
      updatedAt: updatedAccount.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: formattedAccount,
    });
  } catch (error) {
    console.error('Payment account update API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/me/payment-accounts/[id]
 * 결제 계좌 삭제
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 계좌 존재 및 소유권 확인
    const { data: existingAccount, error: fetchError } = await supabase
      .from('user_payment_accounts')
      .select('id, is_primary')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAccount) {
      return NextResponse.json(
        { success: false, error: '계좌를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 계좌 삭제
    const { error: deleteError } = await supabase
      .from('user_payment_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Payment account delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: '계좌 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 기본 계좌가 삭제된 경우, 다른 계좌를 기본으로 설정
    if (existingAccount.is_primary) {
      const { data: remainingAccounts } = await supabase
        .from('user_payment_accounts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (remainingAccounts && remainingAccounts.length > 0) {
        await supabase
          .from('user_payment_accounts')
          .update({ is_primary: true })
          .eq('id', remainingAccounts[0].id);
      }
    }

    return NextResponse.json({
      success: true,
      message: '계좌가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Payment account delete API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
