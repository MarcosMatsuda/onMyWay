import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  SchoolSelect: undefined;
  Map: { schoolId: string; currentLat?: number; currentLng?: number };
  Profile: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainNavigationProp = NativeStackNavigationProp<MainStackParamList>;

export type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;
export type RegisterScreenRouteProp = RouteProp<AuthStackParamList, 'Register'>;
export type HomeScreenRouteProp = RouteProp<MainStackParamList, 'Home'>;
export type SchoolSelectScreenRouteProp = RouteProp<MainStackParamList, 'SchoolSelect'>;
export type MapScreenRouteProp = RouteProp<MainStackParamList, 'Map'>;
export type ProfileScreenRouteProp = RouteProp<MainStackParamList, 'Profile'>;
