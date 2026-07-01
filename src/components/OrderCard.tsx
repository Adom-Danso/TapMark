import React, { useRef } from 'react';
import { Animated, View } from 'react-native';
import styled from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';
import { Order } from '@/schemas/orders';

const CardPressable = styled.Pressable`
  background-color: ${AUTH_COLORS.card};
  border-radius: ${AUTH_RADII.card}px;
  padding: ${AUTH_SPACING.block}px;
  border: 1px solid ${AUTH_COLORS.line};
  shadow-color: ${AUTH_COLORS.shadow};
  shadow-opacity: 1;
  shadow-radius: 10px;
  shadow-offset: 0px 6px;
  elevation: 3;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${AUTH_SPACING.tight}px;
`;

const OrderNumber = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: ${AUTH_COLORS.text};
`;

const StatusPill = styled.View<{ $background?: string }>`
  padding: 6px 12px;
  border-radius: ${AUTH_RADII.pill}px;
  background-color: ${(props) => props.$background || AUTH_COLORS.primarySoft};
`;

const StatusText = styled.Text<{ $color?: string }>`
  font-size: 11px;
  font-weight: 800;
  color: ${(props) => props.$color || AUTH_COLORS.primary};
  text-transform: uppercase;
`;

const StoreName = styled.Text`
  font-size: 13px;
  font-weight: 700;
  color: ${AUTH_COLORS.primary};
  margin-bottom: ${AUTH_SPACING.tight}px;
`;

const Divider = styled.View`
  height: 1.5px;
  background-color: ${AUTH_COLORS.line};
  margin: ${AUTH_SPACING.tight}px 0;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
`;

const Label = styled.Text`
  font-size: 12px;
  color: ${AUTH_COLORS.muted};
  font-weight: 500;
`;

const Value = styled.Text`
  font-size: 13px;
  font-weight: 700;
  color: ${AUTH_COLORS.text};
`;

const TotalValue = styled(Value)`
  font-size: 14px;
  font-weight: 800;
  color: ${AUTH_COLORS.primary};
`;

const BottomRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${AUTH_SPACING.block}px;
`;

const ReorderButton = styled.Pressable`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  background-color: ${AUTH_COLORS.primary};
  border-radius: ${AUTH_RADII.pill}px;
`;

const ReorderText = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: white;
  margin-left: 6px;
`;

const ProgressDots = styled.View`
  flex-direction: row;
  gap: 4px;
  margin-top: 8px;
  align-items: center;
`;

const ProgressDot = styled.View<{ $active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${(props) => (props.$active ? AUTH_COLORS.primary : AUTH_COLORS.line)};
`;

const ProgressLabel = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: ${AUTH_COLORS.text};
  margin-left: 8px;
`;

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'processing':
    case 'accepted':
    case 'placed':
      return { background: AUTH_COLORS.primarySoft, color: AUTH_COLORS.primary };
    case 'completed':
    case 'delivered':
      return { background: '#D9F3E1', color: '#0F8A3C' };
    case 'cancelled':
    case 'rejected':
      return { background: '#FBE2E2', color: '#B42318' };
    default:
      return { background: AUTH_COLORS.primarySoft, color: AUTH_COLORS.primary };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const TRACKING_STAGES = ['placed', 'processing', 'assigned', 'pick_up_completed', 'completed'];

const getProgressIndicator = (trackingStage: string) => {
  const index = TRACKING_STAGES.indexOf(trackingStage);
  return index >= 0 ? index : 0;
};

type OrderStatusLabels = {
  [key: string]: string;
}

const getStageLabel = (trackingStage: string) => {
  const labels: OrderStatusLabels = {
    placed: 'Order placed',
    processing: 'Preparing',
    assigned: "Assigned to courier",
    pick_up_completed: 'Picked up',
    completed: 'Delivered',
    cancelled: "Cancelled",
  };
  return labels[trackingStage] || 'Pending';
};

const getTrackingStage = (order: Order) => {
  if (order.isOrderCompleted || order.orderStatus === 'delivered') {
    return 'completed';
  }

  if (order.orderStatus === 'cancelled' || order.orderStatus === 'rejected') {
    return 'cancelled';
  }

  if (order.isPickedUp) {
    return 'pick_up_completed';
  }

  if (order.assignedCourierId || order.orderStatus === 'accepted') {
    return 'assigned';
  }

  if (order.orderStatus === 'processing') {
    return 'processing';
  }

  return 'placed';
};

const OrderCard = ({ order, onPress, onReorder }: { order: Order; onPress: () => void; onReorder: (order: Order) => void }) => {
  const statusStyle = getStatusStyle(order.orderStatus);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const reorderScaleAnim = useRef(new Animated.Value(1)).current;
  const trackingStage = getTrackingStage(order);
  const progressIndex = getProgressIndicator(trackingStage);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handleReorderPressIn = () => {
    Animated.spring(reorderScaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handleReorderPressOut = () => {
    Animated.spring(reorderScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handleReorderPress = (e: any) => {
    e.stopPropagation();
    if (onReorder) {
      onReorder(order);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <CardPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header: Order Number & Status */}
        <HeaderRow>
          <OrderNumber>{order.orderNumber}</OrderNumber>
          <StatusPill $background={statusStyle.background}>
            <StatusText $color={statusStyle.color}>{getStageLabel(trackingStage)}</StatusText>
          </StatusPill>
        </HeaderRow>


        {/* <Divider /> */}

        {/* Info Rows: Date, Items, ETA (if pending) */}
        <InfoRow>
          <Label>Date placed</Label>
          <Value>{formatDate(order.createdAt)}</Value>
        </InfoRow>

        {/* <InfoRow>
          <Label>Items</Label>
          <Value>{order.cart.cartItems.length}</Value>
        </InfoRow> */}

        {/* Progress Indicator for Pending Orders */}
        {(
          <ProgressDots>
            {TRACKING_STAGES.map((stage, idx) => (
              <ProgressDot key={stage} $active={idx <= progressIndex} />
            ))}
            <ProgressLabel>{getStageLabel(trackingStage)}</ProgressLabel>
          </ProgressDots>
        )}

        {/* <Divider /> */}

        {/* Bottom Row: Total & Reorder Button */}
        {/* <BottomRow>
          <TotalValue>GHS {order.payment.amount.toFixed(2)}</TotalValue>
          {onReorder && (
            <Animated.View style={{ transform: [{ scale: reorderScaleAnim }] }}>
              <ReorderButton
                onPress={handleReorderPress}
                onPressIn={handleReorderPressIn}
                onPressOut={handleReorderPressOut}
              >
                <MaterialIcons name="add-shopping-cart" size={16} color="white" />
                <ReorderText>Reorder</ReorderText>
              </ReorderButton>
            </Animated.View>
          )}
        </BottomRow> */}
      </CardPressable>
    </Animated.View>
  );
};

export default OrderCard;
