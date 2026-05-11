

export type AppStackParamList = {
  Login: undefined;
  Signup: undefined;
  Otp: {
    userId: string;
  };
  Main: undefined;
};

export type MainTabParamList = {
  StoreDetails: {
    id: string;
    name: string;
    imageUri: string;
    rating: number;
    isOpen: boolean;
    averageRating: number;
    ratingCount: number;
    estimatedDeliveryFee: number;
  };
  ItemDetails: {
    id: string;
    name: string;
    imageUri: string;
    price: number;
    description: string;
  };
  Favorites: undefined;
  Profile: undefined;
};

export type GpsLocation = {
    [key: string] : number
}

type AuthData = {
    accessToken: string;
    refreshToken: string;
};


type SuccessResponse<T> = {
    message: string;
    data: T;
    count: number;
    authData?: AuthData;
    nextStep?: string;
};


class ApiError extends Error {
    statusCode: number
    data?: any;

    constructor(message: string, statusCode: number, data?: any) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
    }
}

export type { AuthData, SuccessResponse };
export { ApiError };