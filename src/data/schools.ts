/**
 * Static school data for map rendering
 * This data is pre-loaded to avoid server calls and improve performance
 * Last updated: 2025-01-06
 */

export type SchoolType = '중학교' | '고등학교' | '대학교';

export interface SchoolData {
  id: string;
  name: string;
  short_name: string | null;
  type: SchoolType;
  latitude: number;
  longitude: number;
  active_rooms_count: number;
}

export const SCHOOLS_DATA: SchoolData[] = [
  {"id":"90916522-b748-419f-acde-60d13f695d80","name":"DGIST","short_name":"DGIST","type":"대학교","latitude":35.851,"longitude":128.4915,"active_rooms_count":0},
  {"id":"697644c4-49d7-42ba-a1ca-4ff80aa207e1","name":"GIST","short_name":"GIST","type":"대학교","latitude":35.2293,"longitude":126.8428,"active_rooms_count":0},
  {"id":"0bde4ac4-a07b-4824-8ef1-656373612d90","name":"KAIST","short_name":"KAIST","type":"대학교","latitude":36.3721,"longitude":127.3604,"active_rooms_count":0},
  {"id":"833c3858-65be-4060-b03c-0662890c9b65","name":"POSTECH","short_name":"포스텍","type":"대학교","latitude":36.0107,"longitude":129.3218,"active_rooms_count":0},
  {"id":"163d03bc-7d16-444a-ada6-a6c973eb044f","name":"UNIST","short_name":"UNIST","type":"대학교","latitude":35.5729,"longitude":129.1903,"active_rooms_count":0},
  {"id":"f6d47dd9-a104-439f-93e7-a7272281b175","name":"가천대학교","short_name":null,"type":"대학교","latitude":37.4505,"longitude":127.1272,"active_rooms_count":0},
  {"id":"71b74aac-8910-4edd-9996-bfe4850edeb7","name":"건국대학교","short_name":null,"type":"대학교","latitude":37.5427,"longitude":127.0758,"active_rooms_count":0},
  {"id":"64996841-ef8d-46aa-a7a5-058d8ccdaf27","name":"경기고등학교","short_name":null,"type":"고등학교","latitude":37.5175,"longitude":127.0412,"active_rooms_count":0},
  {"id":"c1932ca6-f31d-4a73-b751-65effb963716","name":"경남고등학교","short_name":null,"type":"고등학교","latitude":35.1567,"longitude":129.0534,"active_rooms_count":0},
  {"id":"3285374d-c7ae-441b-bf79-541aed82e7e8","name":"경북고등학교","short_name":null,"type":"고등학교","latitude":35.8412,"longitude":128.6234,"active_rooms_count":0},
  {"id":"b24cec10-776f-450c-89fa-b1108e72dcd9","name":"경북대학교","short_name":null,"type":"대학교","latitude":35.8886,"longitude":128.6109,"active_rooms_count":0},
  {"id":"3dc1cb4a-e465-4d49-89a5-e318e6e2f04d","name":"경북중학교","short_name":null,"type":"중학교","latitude":35.8398,"longitude":128.6212,"active_rooms_count":0},
  {"id":"c8436709-3b3b-4609-be07-9556e8408bd3","name":"경신고등학교","short_name":null,"type":"고등학교","latitude":35.8356,"longitude":128.6345,"active_rooms_count":0},
  {"id":"cf879403-afbe-4e0e-b297-f39849420287","name":"경희대학교","short_name":null,"type":"대학교","latitude":37.5966,"longitude":127.0512,"active_rooms_count":0},
  {"id":"c1b8ce80-2d55-41ee-a9b9-a1234ae2f98b","name":"경희대학교(국제캠퍼스)","short_name":null,"type":"대학교","latitude":37.2431,"longitude":127.0801,"active_rooms_count":0},
  {"id":"ec27a8f2-410c-43ec-a138-29a5bba5f92f","name":"계명대학교","short_name":null,"type":"대학교","latitude":35.8567,"longitude":128.4889,"active_rooms_count":0},
  {"id":"4ea2f41c-ca0a-45b0-aac1-be94601d13b2","name":"고려대학교","short_name":null,"type":"대학교","latitude":37.5895,"longitude":127.0323,"active_rooms_count":0},
  {"id":"b9104661-7764-45f3-9999-798d21ece74d","name":"광주과학고등학교","short_name":null,"type":"고등학교","latitude":35.2267,"longitude":126.8456,"active_rooms_count":0},
  {"id":"aad4962e-70ae-4b50-b65d-1c860af5f496","name":"광주교육대학교","short_name":null,"type":"대학교","latitude":35.1823,"longitude":126.9034,"active_rooms_count":0},
  {"id":"f8a29d7d-3ab5-4553-ac99-1fb90d169219","name":"광주대학교","short_name":null,"type":"대학교","latitude":35.1234,"longitude":126.8834,"active_rooms_count":0},
  {"id":"fab888c7-33eb-4f3b-987d-dbb0c27e8023","name":"광주외국어고등학교","short_name":null,"type":"고등학교","latitude":35.1289,"longitude":126.8923,"active_rooms_count":0},
  {"id":"d54f8f35-78e4-4f17-a80e-59bd48478763","name":"광주제일고등학교","short_name":null,"type":"고등학교","latitude":35.1678,"longitude":126.9012,"active_rooms_count":0},
  {"id":"0f1bc04c-8aed-4f4f-b95c-0d39402e2800","name":"광주중학교","short_name":null,"type":"중학교","latitude":35.1423,"longitude":126.9201,"active_rooms_count":0},
  {"id":"13ad1337-79cc-4ede-a060-0b96af349250","name":"국민대학교","short_name":null,"type":"대학교","latitude":37.6101,"longitude":126.9976,"active_rooms_count":0},
  {"id":"b39766f4-a97b-42a9-8a21-a7334f7c320d","name":"남목중학교","short_name":null,"type":"중학교","latitude":35.4912,"longitude":129.4089,"active_rooms_count":0},
  {"id":"de992f26-2606-4416-bd4c-593e8428315e","name":"단국대학교부속고등학교","short_name":null,"type":"고등학교","latitude":37.5145,"longitude":127.0389,"active_rooms_count":0},
  {"id":"5f8f8028-19c1-4d40-8845-a64a05ebe31b","name":"대건고등학교","short_name":null,"type":"고등학교","latitude":35.8289,"longitude":128.6178,"active_rooms_count":0},
  {"id":"dcf76b35-86c9-41d7-a2e9-f1e351723d81","name":"대구과학고등학교","short_name":null,"type":"고등학교","latitude":35.8234,"longitude":128.6423,"active_rooms_count":0},
  {"id":"7ccb55c2-df16-46c3-822c-dd88fa8035fa","name":"대구외국어고등학교","short_name":null,"type":"고등학교","latitude":35.9012,"longitude":128.6789,"active_rooms_count":0},
  {"id":"5c73dd47-babc-4404-b5e8-ab4c0d095983","name":"대명중학교","short_name":null,"type":"중학교","latitude":37.4895,"longitude":127.0823,"active_rooms_count":0},
  {"id":"438f624f-4cdc-4b77-aae3-d5c02da9cc3d","name":"대원외국어고등학교","short_name":null,"type":"고등학교","latitude":37.5412,"longitude":127.0734,"active_rooms_count":0},
  {"id":"f9015546-79b2-49b0-82eb-6f44a828c4ca","name":"대전고등학교","short_name":null,"type":"고등학교","latitude":36.3512,"longitude":127.3856,"active_rooms_count":0},
  {"id":"023051d7-6f5c-464d-8ebd-94c7bbd29c76","name":"대전과학고등학교","short_name":null,"type":"고등학교","latitude":36.3756,"longitude":127.3723,"active_rooms_count":0},
  {"id":"4655ea8c-2abb-4726-9d26-eb6e769888af","name":"대전외국어고등학교","short_name":null,"type":"고등학교","latitude":36.3289,"longitude":127.4512,"active_rooms_count":0},
  {"id":"50f71eee-068c-44ed-9efb-7e9cfaf9403f","name":"대청중학교","short_name":null,"type":"중학교","latitude":37.5123,"longitude":127.0598,"active_rooms_count":0},
  {"id":"a971e882-45a7-4edb-8bfa-6d6f1dc82de3","name":"동국대학교","short_name":null,"type":"대학교","latitude":37.5582,"longitude":127.0001,"active_rooms_count":0},
  {"id":"35af5ec7-3478-4584-bce9-2c1400feef61","name":"동래고등학교","short_name":null,"type":"고등학교","latitude":35.2012,"longitude":129.0812,"active_rooms_count":0},
  {"id":"afa8a0d3-a233-4811-bcf9-4c6c781e0466","name":"동래중학교","short_name":null,"type":"중학교","latitude":35.1978,"longitude":129.0789,"active_rooms_count":0},
  {"id":"8f7f0923-8788-422a-9b17-8a39a0d825cb","name":"동아대학교","short_name":null,"type":"대학교","latitude":35.1162,"longitude":128.9679,"active_rooms_count":0},
  {"id":"60dab0b7-dbd4-4fd4-bd84-28d1f4033bd7","name":"민족사관고등학교","short_name":null,"type":"고등학교","latitude":37.5123,"longitude":127.1012,"active_rooms_count":0},
  {"id":"f0c77b82-f2dd-4823-b683-c68f574e3e53","name":"배명고등학교","short_name":null,"type":"고등학교","latitude":37.5178,"longitude":126.9012,"active_rooms_count":0},
  {"id":"e1f543f9-160b-4037-93fc-e058f14b6ef0","name":"배재대학교","short_name":null,"type":"대학교","latitude":36.3234,"longitude":127.3645,"active_rooms_count":0},
  {"id":"a7781edf-7fdc-4a27-a97f-fb4e0eeb8a28","name":"부경대학교","short_name":null,"type":"대학교","latitude":35.1333,"longitude":129.1035,"active_rooms_count":0},
  {"id":"35e5b9a6-6f0e-489e-bc76-1a0dae973f1d","name":"부산과학고등학교","short_name":null,"type":"고등학교","latitude":35.2379,"longitude":129.0823,"active_rooms_count":0},
  {"id":"c4f674b4-7964-4e8b-8424-f8b0185446b7","name":"부산대학교","short_name":null,"type":"대학교","latitude":35.2332,"longitude":129.0809,"active_rooms_count":0},
  {"id":"3d48aaa6-0507-4611-8aec-d797129e9818","name":"부산외국어고등학교","short_name":null,"type":"고등학교","latitude":35.1234,"longitude":129.1012,"active_rooms_count":0},
  {"id":"346994a4-4547-4c05-bc91-84cc6f195597","name":"분당고등학교","short_name":null,"type":"고등학교","latitude":37.3823,"longitude":127.1234,"active_rooms_count":0},
  {"id":"68f92ca9-2133-42a2-8759-201e863a565d","name":"분당중학교","short_name":null,"type":"중학교","latitude":37.3801,"longitude":127.1212,"active_rooms_count":0},
  {"id":"5e0c0441-9d7a-4ebc-8c32-6580b94e6091","name":"서강대학교","short_name":null,"type":"대학교","latitude":37.5515,"longitude":126.941,"active_rooms_count":0},
  {"id":"0496d4e4-61e9-4709-9692-dc0587cf4e58","name":"서귀포중학교","short_name":null,"type":"중학교","latitude":33.2512,"longitude":126.5623,"active_rooms_count":0},
  {"id":"4111b068-062a-4aef-a3a9-4dac48d4a837","name":"서울과학고등학교","short_name":null,"type":"고등학교","latitude":37.5847,"longitude":127.002,"active_rooms_count":0},
  {"id":"9b176636-4005-42eb-b138-4e2d95a0170a","name":"서울대학교","short_name":null,"type":"대학교","latitude":37.4602,"longitude":126.9526,"active_rooms_count":0},
  {"id":"b91a2a3e-fc72-46ef-ab07-90115fd562b8","name":"서울외국어고등학교","short_name":null,"type":"고등학교","latitude":37.4789,"longitude":126.9678,"active_rooms_count":0},
  {"id":"83616b0f-61b8-46e7-b378-8f9640864c0a","name":"성균관대학교","short_name":null,"type":"대학교","latitude":37.5878,"longitude":126.9934,"active_rooms_count":0},
  {"id":"9ea941e8-f9a3-4ff2-95e1-bb72995e3f0d","name":"성균관대학교(자연과학캠퍼스)","short_name":null,"type":"대학교","latitude":37.2938,"longitude":126.9741,"active_rooms_count":0},
  {"id":"50c6d537-146d-4a05-bdd5-bf5419d00316","name":"세화고등학교","short_name":null,"type":"고등학교","latitude":37.4789,"longitude":127.0456,"active_rooms_count":0},
  {"id":"e5381265-c19f-41f7-9323-ef2e29c815b9","name":"송도고등학교","short_name":null,"type":"고등학교","latitude":37.3789,"longitude":126.6589,"active_rooms_count":0},
  {"id":"05e58a6a-99b1-4a82-904d-29d3bbfc8be5","name":"송도중학교","short_name":null,"type":"중학교","latitude":37.3756,"longitude":126.6545,"active_rooms_count":0},
  {"id":"64cb972b-dbd7-433b-b5c0-05bdba3c1806","name":"수성중학교","short_name":null,"type":"중학교","latitude":35.8189,"longitude":128.6378,"active_rooms_count":0},
  {"id":"49c00311-9081-4f4e-ac28-64cad84a00e2","name":"수원외국어고등학교","short_name":null,"type":"고등학교","latitude":37.2912,"longitude":127.0123,"active_rooms_count":0},
  {"id":"fe1b83a5-9f14-49f5-93e6-1895ab1b63d1","name":"숙명여자고등학교","short_name":null,"type":"고등학교","latitude":37.5235,"longitude":127.0287,"active_rooms_count":0},
  {"id":"64ea08d9-bdbf-44fe-bbdb-0696707d902d","name":"숙명여자대학교","short_name":null,"type":"대학교","latitude":37.5456,"longitude":126.9647,"active_rooms_count":0},
  {"id":"f493b43d-266f-4ff0-8fd7-2f23717f7c57","name":"숭실대학교","short_name":null,"type":"대학교","latitude":37.4965,"longitude":126.9571,"active_rooms_count":0},
  {"id":"2f1e752b-2376-42e9-a48e-1ab6373b05eb","name":"신사중학교","short_name":null,"type":"중학교","latitude":37.5168,"longitude":127.0218,"active_rooms_count":0},
  {"id":"271d293c-1f5d-4547-882d-e02c854f984b","name":"아주대학교","short_name":null,"type":"대학교","latitude":37.2827,"longitude":127.0448,"active_rooms_count":0},
  {"id":"26237164-8f04-4897-9fcb-5a34f39acde2","name":"안양외국어고등학교","short_name":null,"type":"고등학교","latitude":37.3912,"longitude":126.9512,"active_rooms_count":0},
  {"id":"98d641ff-2dfd-450b-9ddb-5f16ae6c1d43","name":"압구정고등학교","short_name":null,"type":"고등학교","latitude":37.5287,"longitude":127.0286,"active_rooms_count":0},
  {"id":"96270d19-e800-4658-b9b3-8d36e7fac4ad","name":"압구정중학교","short_name":null,"type":"중학교","latitude":37.5292,"longitude":127.0301,"active_rooms_count":0},
  {"id":"ddefdede-3a75-4c5a-a1d7-17c4bc9655be","name":"언주중학교","short_name":null,"type":"중학교","latitude":37.4867,"longitude":127.0436,"active_rooms_count":0},
  {"id":"b7c169ef-7fd1-4b59-b517-2d7a68625f64","name":"역삼중학교","short_name":null,"type":"중학교","latitude":37.4998,"longitude":127.0365,"active_rooms_count":0},
  {"id":"3037eba8-428c-450b-a3cb-47c952b84b13","name":"연세대학교","short_name":null,"type":"대학교","latitude":37.5665,"longitude":126.9389,"active_rooms_count":0},
  {"id":"16e49f34-ce24-4b1c-833e-e114115eda42","name":"연수중학교","short_name":null,"type":"중학교","latitude":37.3889,"longitude":126.6501,"active_rooms_count":0},
  {"id":"4625a8ec-acf4-42b4-81b3-b8eb9b9ec764","name":"영남대학교","short_name":null,"type":"대학교","latitude":35.8266,"longitude":128.7548,"active_rooms_count":0},
  {"id":"ef222edf-8ac8-4070-ac8d-9e2187082bee","name":"영동일고등학교","short_name":null,"type":"고등학교","latitude":37.5089,"longitude":127.0612,"active_rooms_count":0},
  {"id":"b2898e8f-e8fd-4907-aec9-964071cb0797","name":"용산고등학교","short_name":null,"type":"고등학교","latitude":37.5378,"longitude":126.9612,"active_rooms_count":0},
  {"id":"aa63219d-d5aa-40e7-9b8b-7ec582eddc67","name":"용인외국어고등학교","short_name":null,"type":"고등학교","latitude":37.3234,"longitude":127.1789,"active_rooms_count":0},
  {"id":"4a04c691-2f4a-4229-9d48-86dae539f434","name":"울산고등학교","short_name":null,"type":"고등학교","latitude":35.5289,"longitude":129.3234,"active_rooms_count":0},
  {"id":"5a23d9e0-ebaf-4a3a-8fdd-db39f0242566","name":"울산과학고등학교","short_name":null,"type":"고등학교","latitude":35.5423,"longitude":129.2634,"active_rooms_count":0},
  {"id":"c0b68edf-b531-4323-a76e-b6d80f64d640","name":"울산과학대학교","short_name":null,"type":"대학교","latitude":35.4956,"longitude":129.4156,"active_rooms_count":0},
  {"id":"96d6126e-8511-4d9a-93ba-af1c4c7217cc","name":"울산대학교","short_name":null,"type":"대학교","latitude":35.5444,"longitude":129.2567,"active_rooms_count":0},
  {"id":"ec4d6617-3366-4331-831d-1699a9d801f1","name":"울산중학교","short_name":null,"type":"중학교","latitude":35.5545,"longitude":129.3123,"active_rooms_count":0},
  {"id":"56ffe2c3-5754-44b5-930b-696d8f5eda2a","name":"유성중학교","short_name":null,"type":"중학교","latitude":36.3612,"longitude":127.3534,"active_rooms_count":0},
  {"id":"8785ad9b-0d5a-4a2d-bb54-c194694be502","name":"은광여자고등학교","short_name":null,"type":"고등학교","latitude":37.5134,"longitude":127.0476,"active_rooms_count":0},
  {"id":"3b4078b7-b4d0-43a0-81bd-b29db4533aa9","name":"이화여자대학교","short_name":null,"type":"대학교","latitude":37.5622,"longitude":126.947,"active_rooms_count":0},
  {"id":"4214b70d-b231-433d-b9f4-2c64f5b6c749","name":"인천과학고등학교","short_name":null,"type":"고등학교","latitude":37.3912,"longitude":126.6534,"active_rooms_count":0},
  {"id":"37d261ed-f846-4f3b-ba57-95e27f01b3d4","name":"인천대학교","short_name":null,"type":"대학교","latitude":37.3755,"longitude":126.6328,"active_rooms_count":0},
  {"id":"6890becf-46f1-4a46-b1e3-49f83b60e585","name":"인천외국어고등학교","short_name":null,"type":"고등학교","latitude":37.5389,"longitude":126.7289,"active_rooms_count":0},
  {"id":"0ba2c293-85b1-4bc5-8f0c-18ab42c195a5","name":"인하대학교","short_name":null,"type":"대학교","latitude":37.4505,"longitude":126.6536,"active_rooms_count":0},
  {"id":"62acea57-7c82-4ad2-b899-2d1b0783561e","name":"인하대학교사범대학부속고등학교","short_name":null,"type":"고등학교","latitude":37.4123,"longitude":126.7234,"active_rooms_count":0},
  {"id":"a851dc3a-dd68-47b1-a09a-9171a67000e1","name":"전남고등학교","short_name":null,"type":"고등학교","latitude":35.1456,"longitude":126.9234,"active_rooms_count":0},
  {"id":"a94b377f-1923-4167-928e-6b18d4ee2952","name":"전남대학교","short_name":null,"type":"대학교","latitude":35.1765,"longitude":126.9128,"active_rooms_count":0},
  {"id":"0972f1c0-dd49-41c3-bf29-06118580420b","name":"전남중학교","short_name":null,"type":"중학교","latitude":35.1445,"longitude":126.9223,"active_rooms_count":0},
  {"id":"2306d0f6-79b7-418e-9c5c-4872b522f1fb","name":"제물포고등학교","short_name":null,"type":"고등학교","latitude":37.4512,"longitude":126.6523,"active_rooms_count":0},
  {"id":"ec19cd9c-bc61-4226-8592-3f529166577f","name":"제주과학고등학교","short_name":null,"type":"고등학교","latitude":33.4756,"longitude":126.4234,"active_rooms_count":0},
  {"id":"c1ba2c5d-31b0-404b-8661-1dce1eabf7ee","name":"제주대학교","short_name":null,"type":"대학교","latitude":33.4589,"longitude":126.5612,"active_rooms_count":0},
  {"id":"2d075ea3-8083-4cb3-b701-df5d9118247a","name":"제주외국어고등학교","short_name":null,"type":"고등학교","latitude":33.4523,"longitude":126.4789,"active_rooms_count":0},
  {"id":"b1469ce0-c4bd-4afb-a659-0574af8217c8","name":"제주중학교","short_name":null,"type":"중학교","latitude":33.4967,"longitude":126.5312,"active_rooms_count":0},
  {"id":"df6b6395-2057-493a-af0a-1194a7e38643","name":"조선대학교","short_name":null,"type":"대학교","latitude":35.1389,"longitude":126.9289,"active_rooms_count":0},
  {"id":"6d360cc5-ee54-4959-a3a6-358786957f98","name":"중동고등학교","short_name":null,"type":"고등학교","latitude":37.4872,"longitude":127.0856,"active_rooms_count":0},
  {"id":"2207c6fa-74dd-490b-8493-088588062cc0","name":"중앙대학교","short_name":null,"type":"대학교","latitude":37.5041,"longitude":126.9571,"active_rooms_count":0},
  {"id":"c523449a-39dd-4683-aea2-1fa9032c24a5","name":"청담고등학교","short_name":null,"type":"고등학교","latitude":37.5198,"longitude":127.0537,"active_rooms_count":0},
  {"id":"15262509-9c32-4985-98de-85fcc8ef8d70","name":"청담중학교","short_name":null,"type":"중학교","latitude":37.5215,"longitude":127.0384,"active_rooms_count":0},
  {"id":"d218f147-fb2b-4caa-8e2c-34e65087873f","name":"충남고등학교","short_name":null,"type":"고등학교","latitude":36.3123,"longitude":127.4234,"active_rooms_count":0},
  {"id":"41f50606-1725-4b16-87c6-cb9be003f78d","name":"충남대학교","short_name":null,"type":"대학교","latitude":36.3688,"longitude":127.3457,"active_rooms_count":0},
  {"id":"b2a9d730-f946-4afa-abd3-bf6277b2e170","name":"충남중학교","short_name":null,"type":"중학교","latitude":36.3101,"longitude":127.4212,"active_rooms_count":0},
  {"id":"fe2fb7cc-cad1-48cd-808b-35bba9778fb9","name":"카이스트","short_name":null,"type":"대학교","latitude":36.3699,"longitude":127.3621,"active_rooms_count":0},
  {"id":"d8ff6480-19b7-44af-a9bc-d97836cb5c09","name":"하나고등학교","short_name":null,"type":"고등학교","latitude":37.6234,"longitude":126.9234,"active_rooms_count":0},
  {"id":"ceff31fb-80b8-4d24-a28a-614a6b379d21","name":"학성고등학교","short_name":null,"type":"고등학교","latitude":35.5567,"longitude":129.3145,"active_rooms_count":0},
  {"id":"5b92fa6b-b13d-4683-97fd-dc13b00f6f64","name":"한국외국어대학교(글로벌캠퍼스)","short_name":null,"type":"대학교","latitude":37.3389,"longitude":127.2656,"active_rooms_count":0},
  {"id":"e4594ac5-412e-4cff-886b-1705e841ed11","name":"한남대학교","short_name":null,"type":"대학교","latitude":36.3545,"longitude":127.4189,"active_rooms_count":0},
  {"id":"dba46c95-8e7d-4f16-a033-743d0c2a10fe","name":"한양대학교","short_name":null,"type":"대학교","latitude":37.5579,"longitude":127.047,"active_rooms_count":0},
  {"id":"70490962-58a8-4b79-ba4d-93b14d8f2ec5","name":"한영외국어고등학교","short_name":null,"type":"고등학교","latitude":37.5534,"longitude":127.1456,"active_rooms_count":0},
  {"id":"d49bafc0-a2dc-43de-9438-d6e60d6434f6","name":"해운대고등학교","short_name":null,"type":"고등학교","latitude":35.1623,"longitude":129.1634,"active_rooms_count":0},
  {"id":"64132baf-b1e3-4318-b5c1-a9f132ad1f49","name":"해운대중학교","short_name":null,"type":"중학교","latitude":35.1598,"longitude":129.1601,"active_rooms_count":0},
  {"id":"caacb0bd-eb2c-443f-b706-5871dfbebcea","name":"현대고등학교","short_name":null,"type":"고등학교","latitude":35.5012,"longitude":129.4256,"active_rooms_count":0},
  {"id":"44eb530f-ed54-48b4-89e8-dad2d29919b8","name":"홍익대학교","short_name":null,"type":"대학교","latitude":37.5507,"longitude":126.9259,"active_rooms_count":0},
  {"id":"9a4cc74e-a7ab-4ead-bf98-1fcc773b785e","name":"휘문고등학교","short_name":null,"type":"고등학교","latitude":37.504,"longitude":127.0416,"active_rooms_count":0},
  {"id":"edd830e8-e15b-463f-9b33-c51c0ec1fd45","name":"휘문중학교","short_name":null,"type":"중학교","latitude":37.5038,"longitude":127.042,"active_rooms_count":0},
];

/**
 * Get schools near a location
 * @param lat - User latitude
 * @param lng - User longitude
 * @param radiusKm - Search radius in kilometers (default: 10km)
 * @param types - School types to filter (optional)
 */
export function getSchoolsNearLocation(
  lat: number,
  lng: number,
  radiusKm: number = 10,
  types?: SchoolType[]
): SchoolData[] {
  const filtered = types
    ? SCHOOLS_DATA.filter(s => types.includes(s.type))
    : SCHOOLS_DATA;

  return filtered.filter(school => {
    const distance = getDistanceKm(lat, lng, school.latitude, school.longitude);
    return distance <= radiusKm;
  }).sort((a, b) => {
    const distA = getDistanceKm(lat, lng, a.latitude, a.longitude);
    const distB = getDistanceKm(lat, lng, b.latitude, b.longitude);
    return distA - distB;
  });
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses Haversine formula
 */
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default SCHOOLS_DATA;
